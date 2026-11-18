<?php

namespace App\Http\Controllers;

use App\Models\CertificationProgram;
use App\Services\Brevetlearning\BrevetlearningClient;
use App\Services\Brevetlearning\BrevetlearningException;
use App\Services\Brevetlearning\ProgramParticipants;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Tab Pendaftar ↔ kelas brevetlearning: tanda peserta yang sudah masuk
 * kelas, peringatan peserta susulan, dan tombol kirim (manual, bukan otomatis).
 */
class CertificationProgramBrevetController extends Controller
{
    public function __construct(
        private BrevetlearningClient $client,
        private ProgramParticipants $participants,
    ) {
    }

    public function status(CertificationProgram $program): JsonResponse
    {
        return response()->json($this->buildStatus($program));
    }

    public function link(Request $request, CertificationProgram $program): JsonResponse
    {
        $validated = $request->validate([
            'course_code' => 'nullable|string|max:64',
            'platform' => 'nullable|string|max:100',
        ]);

        $code = trim((string) ($validated['course_code'] ?? ''));
        if ($code === '') {
            $program->update(['brevetlearning_course_code' => null, 'brevetlearning_platform' => null]);

            return response()->json($this->buildStatus($program->fresh()));
        }

        try {
            $course = $this->client->lookup($code);
        } catch (BrevetlearningException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }
        if (!$course) {
            return response()->json(['message' => "Kode kelas {$code} tidak ditemukan di brevetlearning."], 422);
        }

        $program->update([
            'brevetlearning_course_code' => $course['code'],
            'brevetlearning_platform' => $validated['platform'] ?: $this->client->defaultPlatform(),
        ]);

        return response()->json($this->buildStatus($program->fresh(), $course));
    }

    public function send(CertificationProgram $program): JsonResponse
    {
        if (!$program->brevetlearning_course_code) {
            return response()->json(['message' => 'Isi dan simpan kode kelas brevetlearning dulu.'], 422);
        }

        $status = $this->buildStatus($program);
        if (!empty($status['error'])) {
            return response()->json(['message' => $status['error']], 502);
        }

        $missing = collect($status['participants'])->where('in_class', false)->values();
        if ($missing->isEmpty()) {
            return response()->json(['result' => null] + $status);
        }

        try {
            $result = $this->client->enroll(
                $program->brevetlearning_course_code,
                $program->brevetlearning_platform,
                $missing->map(fn ($p) => [
                    'name' => $p['name'],
                    'email' => $p['email'],
                    'phone_number' => $p['phone_number'],
                ])->all(),
            );
        } catch (BrevetlearningException $e) {
            return response()->json(['message' => $e->getMessage()], 502);
        }

        return response()->json([
            'result' => ['summary' => $result['summary'] ?? [], 'results' => $result['results'] ?? []],
        ] + $this->buildStatus($program));
    }

    private function buildStatus(CertificationProgram $program, ?array $course = null): array
    {
        $base = [
            'configured' => $this->client->configured(),
            'course_code' => $program->brevetlearning_course_code,
            'platform' => $program->brevetlearning_platform ?: $this->client->defaultPlatform(),
            'platforms' => [],
            'course' => null,
            'participants' => [],
            'summary' => ['eligible' => 0, 'in_class' => 0, 'missing' => 0],
            'error' => null,
            'notice' => null,
        ];

        if (!$base['configured']) {
            return $base;
        }

        try {
            $base['platforms'] = $this->client->platforms();
            if ($program->brevetlearning_course_code) {
                $course ??= $this->client->lookup($program->brevetlearning_course_code);
                if (!$course) {
                    // Kelas sudah dihapus di brevetlearning: putus hubungan agar Cava & panel tidak menunjuk kelas hantu.
                    $lama = $program->brevetlearning_course_code;
                    $program->update(['brevetlearning_course_code' => null, 'brevetlearning_platform' => null]);
                    Log::info('brevetlearning: hubungan batch diputus, kelas sudah dihapus', ['program_id' => $program->id, 'code' => $lama]);
                    $base['course_code'] = null;
                    $base['notice'] = "Kelas {$lama} sudah tidak ada di brevetlearning, jadi hubungannya diputus otomatis. Isi kode baru bila batch ini pindah kelas.";
                }
            }
        } catch (BrevetlearningException $e) {
            $base['error'] = $e->getMessage();
        }

        $inClassEmails = collect($course['participants'] ?? [])->map(fn ($p) => strtolower(trim($p['email'] ?? '')))->filter()->flip();
        $inClassPhones = collect($course['participants'] ?? [])->map(fn ($p) => ProgramParticipants::normalizePhone($p['phone_number'] ?? null))
            ->filter(fn ($p) => strlen($p) >= 8)->flip();

        $participants = $this->participants->eligible($program)->map(function ($p) use ($course, $inClassEmails, $inClassPhones) {
            $phone = ProgramParticipants::normalizePhone($p['phone_number']);
            $p['in_class'] = $course !== null
                && ($inClassEmails->has(strtolower($p['email'])) || (strlen($phone) >= 8 && $inClassPhones->has($phone)));

            return $p;
        });

        $inClass = $participants->where('in_class', true)->count();
        $base['course'] = $course ? collect($course)->except('participants')->all() : null;
        $base['participants'] = $participants->values()->all();
        $base['summary'] = ['eligible' => $participants->count(), 'in_class' => $inClass, 'missing' => $participants->count() - $inClass];

        return $base;
    }
}
