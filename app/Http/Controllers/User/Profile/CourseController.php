<?php

namespace App\Http\Controllers\User\Profile;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use App\Models\CertificateParticipant;
use App\Models\CourseRating;
use App\Models\Invoice;
use App\Models\LessonCompletion;
use App\Services\CertificatePdfService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CourseController extends Controller
{
    protected $pdfService;

    public function __construct(CertificatePdfService $pdfService)
    {
        $this->pdfService = $pdfService;
    }

    public function index()
    {
        $userId = Auth::id();
        $myCourses = Invoice::with(['courseItems.course.category', 'installmentTerms'])
            ->purchasedByUser($userId)
            ->orderBy('created_at', 'desc')
            ->get();
        return Inertia::render('user/profile/course/index', ['myCourses' => $myCourses]);
    }

    public function detail($slug)
    {
        $userId = Auth::id();

        $course = Invoice::with([
            'installmentTerms',
            'courseItems' => function ($query) use ($slug) {
                $query->whereHas('course', function ($q) use ($slug) {
                    $q->where('slug', $slug);
                })->with('course.category');
            }
        ])
            ->purchasedByUser($userId)
            ->whereHas('courseItems.course', function ($query) use ($slug) {
                $query->where('slug', $slug);
            })
            ->orderBy('created_at', 'desc')
            ->first();

        if (!$course || $course->courseItems->isEmpty()) {
            abort(404, 'Kelas tidak ditemukan atau Anda belum terdaftar.');
        }

        $courseRating = null;
        $certificate = null;
        $certificateParticipant = null;

        $courseItem = $course->courseItems->first();
        $courseId = $courseItem->course_id;
        $courseData = $courseItem->course;

        // Auto-recalculate progress from lesson completions if out of sync
        if ($courseData) {
            $totalLessons = $courseData->modules()
                ->withCount('lessons')
                ->get()
                ->sum('lessons_count');

            if ($totalLessons > 0) {
                $completedLessons = LessonCompletion::where('user_id', $userId)
                    ->whereHas('lesson.module', function ($query) use ($courseId) {
                        $query->where('course_id', $courseId);
                    })
                    ->count();

                $actualProgress = round(($completedLessons / $totalLessons) * 100);
                $expectedCompletedAt = $actualProgress >= 100 ? ($courseItem->completed_at ?? now()) : null;
                if ($actualProgress !== (int) $courseItem->progress || ($actualProgress < 100 && $courseItem->completed_at !== null)) {
                    $courseItem->update([
                        'progress' => $actualProgress,
                        'completed_at' => $expectedCompletedAt,
                    ]);
                    $courseItem->progress = $actualProgress;
                    $courseItem->completed_at = $expectedCompletedAt;
                }
            } elseif ((int) $courseItem->progress < 100 && $courseItem->completed_at !== null) {
                $courseItem->update(['completed_at' => null]);
                $courseItem->completed_at = null;
            }
        }

        $courseRating = CourseRating::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->first();

        $certificate = Certificate::where('course_id', $courseId)->first();

        if ($certificate) {
            $certificateParticipant = $this->resolveOrCreateCertificateParticipant($course, $courseItem, $certificate, $userId);
        }

        $course->append(['has_active_access', 'is_fully_paid']);

        $courseId = $course->courseItems->first()?->course_id;
        $activeInstallment = null;
        if ($courseId && $course->is_installment) {
            $activeInstallment = Invoice::getActiveInstallmentForUser($userId, 'course', $courseId);
        }

        return Inertia::render('user/profile/course/detail', [
            'course' => $course,
            'courseRating' => $courseRating,
            'certificate' => $certificate,
            'certificateParticipant' => ($course->is_installment && !$course->isFullyPaid()) ? null : $certificateParticipant,
            'active_installment' => $activeInstallment,
        ]);
    }

    public function downloadCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $course = Invoice::with([
                'installmentTerms',
                'courseItems' => function ($query) use ($slug) {
                    $query->whereHas('course', function ($q) use ($slug) {
                        $q->where('slug', $slug);
                    })->with('course'); // ✅ filter by slug
                }
            ])
                ->purchasedByUser($userId)
                ->whereHas('courseItems.course', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$course) {
                return back()->with('error', 'Course tidak ditemukan atau Anda belum terdaftar.');
            }

            if ($course->is_installment && !$course->isFullyPaid()) {
                return back()->with('error', 'Sertifikat kelulusan hanya dapat diunduh setelah seluruh termin cicilan lunas.');
            }

            $courseItem = $course->courseItems->first(); // ✅ sudah difilter by slug

            if (!$courseItem) {
                return back()->with('error', 'Course tidak ditemukan.');
            }

            $courseData = $courseItem->course;

            if ($courseItem->progress < 100) {
                return back()->with('error', 'Sertifikat belum tersedia. Selesaikan seluruh materi course terlebih dahulu.');
            }

            $courseRating = CourseRating::where('user_id', $userId)
                ->where('course_id', $courseData->id)
                ->first();

            if (!$courseRating) {
                return back()->with('error', 'Berikan rating dan review terlebih dahulu untuk mendapatkan sertifikat.');
            }

            $certificate = Certificate::where('course_id', $courseData->id)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk course ini.');
            }

            $participant = $this->resolveOrCreateCertificateParticipant($course, $courseItem, $certificate, $userId);

            if (!$participant) {
                return back()->with('error', 'Data participant sertifikat tidak ditemukan.');
            }

            $pdf = $this->pdfService->generateParticipantCertificate($participant);
            $filename = 'sertifikat-' . $participant->certificate_code . '.pdf';

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'attachment; filename="' . $filename . '"');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal mengunduh sertifikat: ' . $e->getMessage());
        }
    }

    public function previewCertificate($slug)
    {
        try {
            $userId = Auth::id();

            $course = Invoice::with([
                'installmentTerms',
                'courseItems' => function ($query) use ($slug) {
                    $query->whereHas('course', function ($q) use ($slug) {
                        $q->where('slug', $slug);
                    })->with('course'); // ✅ filter by slug
                }
            ])
                ->purchasedByUser($userId)
                ->whereHas('courseItems.course', function ($query) use ($slug) {
                    $query->where('slug', $slug);
                })
                ->orderBy('created_at', 'desc')
                ->first();

            if (!$course) {
                return back()->with('error', 'Course tidak ditemukan atau Anda belum terdaftar.');
            }

            if ($course->is_installment && !$course->isFullyPaid()) {
                return back()->with('error', 'Sertifikat kelulusan hanya dapat diunduh setelah seluruh termin cicilan lunas.');
            }

            $courseItem = $course->courseItems->first(); // ✅ sudah difilter by slug

            if (!$courseItem) {
                return back()->with('error', 'Course tidak ditemukan.');
            }

            $courseData = $courseItem->course;

            if ($courseItem->progress < 100) {
                return back()->with('error', 'Sertifikat belum tersedia. Selesaikan seluruh materi course terlebih dahulu.');
            }

            $courseRating = CourseRating::where('user_id', $userId)
                ->where('course_id', $courseData->id)
                ->first();

            if (!$courseRating) {
                return back()->with('error', 'Berikan rating dan review terlebih dahulu untuk mendapatkan sertifikat.');
            }

            $certificate = Certificate::where('course_id', $courseData->id)->first();

            if (!$certificate) {
                return back()->with('error', 'Sertifikat belum dibuat untuk course ini.');
            }

            $participant = $this->resolveOrCreateCertificateParticipant($course, $courseItem, $certificate, $userId);

            if (!$participant) {
                return back()->with('error', 'Data participant sertifikat tidak ditemukan.');
            }

            $pdf = $this->pdfService->generateParticipantCertificate($participant);

            return response($pdf)
                ->header('Content-Type', 'application/pdf')
                ->header('Content-Disposition', 'inline; filename="preview-sertifikat-' . $participant->certificate_code . '.pdf"');
        } catch (\Exception $e) {
            return back()->with('error', 'Gagal memuat preview sertifikat: ' . $e->getMessage());
        }
    }

    /**
     * Resolve or create the certificate participant record once a course is paid and completed.
     */
    private function resolveOrCreateCertificateParticipant(Invoice $course, $courseItem, Certificate $certificate, $userId): ?CertificateParticipant
    {
        $participant = CertificateParticipant::where('certificate_id', $certificate->id)
            ->where('user_id', $userId)
            ->first();

        if (!$participant && $course->isFullyPaid() && $courseItem->canDownloadCertificate()) {
            $participant = CertificateParticipant::create([
                'certificate_id' => $certificate->id,
                'user_id' => $userId,
            ]);
        }

        return $participant;
    }
}
