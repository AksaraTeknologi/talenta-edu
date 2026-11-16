<?php

namespace Tests\Feature;

use App\Models\AffiliateEarning;
use App\Models\Bootcamp;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\CertificateDesign;
use App\Models\CertificateParticipant;
use App\Models\CertificateSign;
use App\Models\Course;
use App\Models\CourseRating;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentCourse;
use App\Models\EnrollmentWebinar;
use App\Models\Invoice;
use App\Models\Lesson;
use App\Models\LessonCompletion;
use App\Models\Module;
use App\Models\User;
use App\Models\Webinar;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InstallmentSecurityHardeningTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $mentor;
    protected User $buyer;
    protected User $otherBuyer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'mentor']);
        Role::firstOrCreate(['name' => 'user']);
        Role::firstOrCreate(['name' => 'affiliate']);

        $this->admin = User::factory()->create(['email' => 'admin@security.test']);
        $this->admin->assignRole('admin');

        $this->mentor = User::factory()->create(['email' => 'mentor@security.test']);
        $this->mentor->assignRole('mentor');

        $this->buyer = User::factory()->create(['email' => 'buyer@security.test', 'phone_number' => '0811111111']);
        $this->buyer->assignRole('user');

        $this->otherBuyer = User::factory()->create(['email' => 'other@security.test']);
        $this->otherBuyer->assignRole('user');
    }

    protected function postGatewayTermSettlement(Invoice $term)
    {
        $serverKey = config('midtrans.server_key') ?: 'SB-Mid-server-TESTKEY123';
        config(['midtrans.server_key' => $serverKey]);
        $orderId = $term->invoice_code;
        $statusCode = '200';
        $grossAmount = (string) (int) $term->amount;
        $signatureKey = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);

        return $this->postJson(route('midtrans.callback'), [
            'order_id' => $orderId,
            'status_code' => $statusCode,
            'gross_amount' => $grossAmount,
            'signature_key' => $signatureKey,
            'transaction_status' => 'settlement',
            'payment_type' => 'bank_transfer',
            'va_numbers' => [
                ['va_number' => '1234567890', 'bank' => 'bca'],
            ],
        ]);
    }

    public function test_installment_admin_routes_forbidden_for_regular_user_and_mentor()
    {
        $response = $this->actingAs($this->mentor)->post(route('admin.installment-terms.store'), [
            'type' => 'bootcamp',
            'id' => '1',
            'installment_enabled' => true,
            'terms' => [
                ['term_number' => 1, 'amount' => 500000, 'due_date' => now()->toDateString()],
                ['term_number' => 2, 'amount' => 500000, 'due_date' => now()->addDays(30)->toDateString()],
            ],
        ]);
        $response->assertStatus(403);

        $response = $this->actingAs($this->buyer)->post(route('admin.installment-terms.store'), [
            'type' => 'bootcamp',
            'id' => '1',
            'installment_enabled' => true,
            'terms' => [
                ['term_number' => 1, 'amount' => 500000, 'due_date' => now()->toDateString()],
                ['term_number' => 2, 'amount' => 500000, 'due_date' => now()->addDays(30)->toDateString()],
            ],
        ]);
        $response->assertStatus(403);
    }

    public function test_installment_term_creation_requires_minimum_two_terms_and_full_price_sum()
    {
        $category = Category::create(['name' => 'IT', 'slug' => 'it']);
        $bootcamp = Bootcamp::create([
            'title' => 'Web Dev Bootcamp',
            'slug' => 'web-dev-bootcamp',
            'price' => 1000000,
            'category_id' => $category->id,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(60),
            'status' => 'published',
        ]);

        $response = $this->actingAs($this->admin)->postJson(route('admin.installment-terms.store'), [
            'type' => 'bootcamp',
            'id' => (string) $bootcamp->id,
            'installment_enabled' => true,
            'terms' => [
                ['term_number' => 1, 'amount' => 1000000, 'due_date' => now()->toDateString()],
            ],
        ]);
        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Minimal harus ada 2 termin cicilan.',
            ]);

        $response = $this->actingAs($this->admin)->postJson(route('admin.installment-terms.store'), [
            'type' => 'bootcamp',
            'id' => (string) $bootcamp->id,
            'installment_enabled' => true,
            'terms' => [
                ['term_number' => 1, 'amount' => 400000, 'due_date' => now()->toDateString()],
                ['term_number' => 2, 'amount' => 400000, 'due_date' => now()->addDays(30)->toDateString()],
            ],
        ]);
        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Total nominal cicilan tidak boleh kurang dari harga produk.',
            ]);

        $response = $this->actingAs($this->admin)->postJson(route('admin.installment-terms.store'), [
            'type' => 'bootcamp',
            'id' => (string) $bootcamp->id,
            'installment_enabled' => true,
            'terms' => [
                ['term_number' => 1, 'amount' => 500000, 'due_date' => now()->toDateString()],
                ['term_number' => 2, 'amount' => 500000, 'due_date' => now()->addDays(30)->toDateString()],
            ],
        ]);
        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_invoice_pdf_download_prevents_idor_for_other_users()
    {
        $buyerInvoice = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-SEC-001',
            'amount' => 500000,
            'nett_amount' => 500000,
            'status' => 'paid',
            'is_installment' => false,
        ]);

        $response = $this->actingAs($this->otherBuyer)->get(route('invoice.pdf', $buyerInvoice->id));
        $response->assertStatus(403);
    }

    public function test_affiliate_commission_is_idempotent_on_duplicate_recording()
    {
        $affiliate = User::factory()->create([
            'affiliate_code' => 'AFFTEST',
            'affiliate_status' => 'Active',
            'commission' => 10,
        ]);
        $affiliate->assignRole('affiliate');

        $invoice = Invoice::create([
            'user_id' => $this->buyer->id,
            'referred_by_user_id' => $affiliate->id,
            'invoice_code' => 'TLT-AFF-001',
            'amount' => 1000000,
            'nett_amount' => 1000000,
            'affiliate_code' => 'AFFTEST',
            'status' => 'paid',
            'is_installment' => false,
        ]);

        $controller = app(\App\Http\Controllers\InvoiceController::class);
        $recordMethod = new \ReflectionMethod($controller, 'recordAffiliateCommission');
        $recordMethod->setAccessible(true);

        $recordMethod->invoke($controller, $invoice);
        $this->assertEquals(1, AffiliateEarning::where('invoice_id', $invoice->id)->count());

        $recordMethod->invoke($controller, $invoice);
        $this->assertEquals(1, AffiliateEarning::where('invoice_id', $invoice->id)->count());
    }

    public function test_certificate_download_and_preview_forbidden_when_installment_not_fully_paid()
    {
        $category = Category::create(['name' => 'Data', 'slug' => 'data']);
        $bootcamp = Bootcamp::create([
            'title' => 'Data Science Bootcamp',
            'slug' => 'data-science-bootcamp',
            'price' => 1000000,
            'category_id' => $category->id,
            'start_date' => now()->subDays(60),
            'end_date' => now()->subDays(5),
            'has_certificate' => true,
            'requires_review' => true,
            'installment_enabled' => true,
            'status' => 'published',
        ]);

        $design = CertificateDesign::create(['name' => 'Design Bootcamp Sec']);
        $sign = CertificateSign::create(['name' => 'Sign Bootcamp Sec', 'position' => 'Director']);
        $certificate = Certificate::create([
            'design_id' => $design->id,
            'sign_id' => $sign->id,
            'bootcamp_id' => $bootcamp->id,
            'certificate_number' => 'CERT-BOOT-SEC-001',
            'title' => 'Sertifikat Bootcamp',
            'page_count' => 1,
            'second_page_grade' => false,
        ]);

        $parentInvoice = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-CERT-001',
            'amount' => 1000000,
            'nett_amount' => 1000000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parentInvoice->id,
            'invoice_code' => 'TLT-CERT-001-1',
            'amount' => 500000,
            'nett_amount' => 500000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);

        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parentInvoice->id,
            'invoice_code' => 'TLT-CERT-001-2',
            'amount' => 500000,
            'nett_amount' => 500000,
            'installment_number' => 2,
            'status' => 'pending',
            'is_installment' => false,
        ]);

        $enrollment = EnrollmentBootcamp::create([
            'invoice_id' => $parentInvoice->id,
            'bootcamp_id' => $bootcamp->id,
            'price' => 1000000,
            'rating' => 5,
            'review' => 'Great bootcamp',
        ]);

        $this->assertFalse($enrollment->fresh()->canDownloadCertificate());

        $participant = CertificateParticipant::create([
            'certificate_id' => $certificate->id,
            'user_id' => $this->buyer->id,
        ]);
        $this->assertFalse($participant->isEligible());

        $response = $this->actingAs($this->buyer)->get(route('profile.bootcamp.certificate', $bootcamp->slug));
        $response->assertSessionHas('error', 'Sertifikat kelulusan hanya dapat diunduh setelah seluruh termin cicilan lunas.');

        $previewResponse = $this->actingAs($this->buyer)->get(route('profile.bootcamp.certificate.preview', $bootcamp->slug));
        $previewResponse->assertSessionHas('error', 'Sertifikat kelulusan hanya dapat diunduh setelah seluruh termin cicilan lunas.');

        $detailResponse = $this->actingAs($this->buyer)->get(route('profile.bootcamp.detail', $bootcamp->slug));
        $detailResponse->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('user/profile/bootcamp/detail')
                ->where('certificateParticipant', null)
            );

        $this->actingAs($this->buyer)->get(route('certificate.participant.detail', $participant->certificate_code))->assertStatus(403);
        $this->get(route('certificate.participant.detail', $participant->certificate_code))->assertStatus(403);
        $this->actingAs($this->buyer)->get(route('certificate.participant.pdf', $participant->certificate_code))->assertStatus(403);
        $this->actingAs($this->buyer)->get(route('certificate.participant.download.public', $participant->certificate_code))->assertStatus(403);

        $this->actingAs($this->admin)->get(route('certificate.participant.detail', $participant->certificate_code))->assertStatus(200);

        $this->get(route('certificates.check', [
            'email' => $this->buyer->email,
            'phone_number' => $this->buyer->phone_number,
        ]))->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('user/check-certificate')
                ->has('participants', 0)
            );
    }

    public function test_course_and_webinar_certificates_blocked_when_installment_unpaid_and_unlocked_when_paid()
    {
        $category = Category::create(['name' => 'Tax', 'slug' => 'tax-cert']);
        $design = CertificateDesign::create(['name' => 'Design CW Sec']);
        $sign = CertificateSign::create(['name' => 'Sign CW Sec', 'position' => 'Director']);

        $course = Course::create([
            'category_id' => $category->id,
            'user_id' => $this->mentor->id,
            'title' => 'Tax Course Cert',
            'slug' => 'tax-course-cert',
            'price' => 800000,
            'strikethrough_price' => 0,
            'status' => 'published',
            'level' => 'beginner',
            'installment_enabled' => true,
        ]);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Mod 1', 'order' => 1]);
        $lesson = Lesson::create(['module_id' => $module->id, 'title' => 'Lesson 1', 'type' => 'text', 'order' => 1]);
        LessonCompletion::create(['user_id' => $this->buyer->id, 'lesson_id' => $lesson->id, 'completed_at' => now()]);
        CourseRating::create([
            'user_id' => $this->buyer->id,
            'course_id' => $course->id,
            'rating' => 5,
            'review' => 'Materi lengkap',
            'status' => 'approved',
        ]);
        $courseCert = Certificate::create([
            'design_id' => $design->id,
            'sign_id' => $sign->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-CRS-SEC-001',
            'title' => 'Sertifikat Course',
            'page_count' => 1,
            'second_page_grade' => false,
        ]);

        $webinar = Webinar::create([
            'user_id' => $this->mentor->id,
            'category_id' => $category->id,
            'title' => 'Tax Webinar Cert',
            'slug' => 'tax-webinar-cert',
            'price' => 400000,
            'start_time' => now()->subDays(4),
            'end_time' => now()->subDays(3),
            'status' => 'published',
            'quota' => 50,
            'has_certificate' => true,
            'requires_review' => true,
            'installment_enabled' => true,
        ]);
        $webinarCert = Certificate::create([
            'design_id' => $design->id,
            'sign_id' => $sign->id,
            'webinar_id' => $webinar->id,
            'certificate_number' => 'CERT-WEB-SEC-001',
            'title' => 'Sertifikat Webinar',
            'page_count' => 1,
            'second_page_grade' => false,
        ]);

        $courseParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-CRS-SEC-01',
            'amount' => 800000,
            'nett_amount' => 800000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $courseParent->id,
            'invoice_code' => 'TLT-CRS-SEC-01-T1',
            'amount' => 400000,
            'nett_amount' => 400000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);
        $courseTerm2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $courseParent->id,
            'invoice_code' => 'TLT-CRS-SEC-01-T2',
            'amount' => 400000,
            'nett_amount' => 400000,
            'installment_number' => 2,
            'status' => 'pending',
            'is_installment' => false,
        ]);
        $enrollmentCourse = EnrollmentCourse::create([
            'invoice_id' => $courseParent->id,
            'course_id' => $course->id,
            'price' => 800000,
            'progress' => 100,
        ]);

        $webinarParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-WEB-SEC-01',
            'amount' => 400000,
            'nett_amount' => 400000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $webinarParent->id,
            'invoice_code' => 'TLT-WEB-SEC-01-T1',
            'amount' => 200000,
            'nett_amount' => 200000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);
        $webinarTerm2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $webinarParent->id,
            'invoice_code' => 'TLT-WEB-SEC-01-T2',
            'amount' => 200000,
            'nett_amount' => 200000,
            'installment_number' => 2,
            'status' => 'pending',
            'is_installment' => false,
        ]);
        $enrollmentWebinar = EnrollmentWebinar::create([
            'invoice_id' => $webinarParent->id,
            'webinar_id' => $webinar->id,
            'price' => 400000,
            'attendance_proof' => 'attendance/proof.jpg',
            'attendance_verified' => true,
            'rating' => 5,
            'review' => 'Sangat membantu',
        ]);

        $courseParticipant = CertificateParticipant::create([
            'certificate_id' => $courseCert->id,
            'user_id' => $this->buyer->id,
        ]);
        $webinarParticipant = CertificateParticipant::create([
            'certificate_id' => $webinarCert->id,
            'user_id' => $this->buyer->id,
        ]);

        $this->assertFalse($enrollmentCourse->fresh()->canDownloadCertificate());
        $this->assertFalse($enrollmentWebinar->fresh()->canDownloadCertificate());
        $this->assertFalse($courseParticipant->fresh()->isEligible());
        $this->assertFalse($webinarParticipant->fresh()->isEligible());

        $this->actingAs($this->buyer)
            ->get(route('profile.course.certificate', $course->slug))
            ->assertSessionHas('error', 'Sertifikat kelulusan hanya dapat diunduh setelah seluruh termin cicilan lunas.');
        $this->actingAs($this->buyer)
            ->get(route('profile.course.certificate.preview', $course->slug))
            ->assertSessionHas('error', 'Sertifikat kelulusan hanya dapat diunduh setelah seluruh termin cicilan lunas.');

        $this->actingAs($this->buyer)
            ->get(route('profile.webinar.certificate', $webinar->slug))
            ->assertSessionHas('error', 'Sertifikat kelulusan hanya dapat diunduh setelah seluruh termin cicilan lunas.');
        $this->actingAs($this->buyer)
            ->get(route('profile.webinar.certificate.preview', $webinar->slug))
            ->assertSessionHas('error', 'Sertifikat kelulusan hanya dapat diakses setelah seluruh termin cicilan lunas.');

        $this->actingAs($this->buyer)
            ->get(route('profile.course.detail', $course->slug))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->where('certificateParticipant', null));

        $this->actingAs($this->buyer)
            ->get(route('profile.webinar.detail', $webinar->slug))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->where('certificateParticipant', null));

        $this->actingAs($this->buyer)
            ->get(route('certificate.participant.detail', $courseParticipant->certificate_code))
            ->assertStatus(403);
        $this->actingAs($this->buyer)
            ->get(route('certificate.participant.detail', $webinarParticipant->certificate_code))
            ->assertStatus(403);

        $courseTerm2->update(['status' => 'paid', 'paid_at' => now()]);
        $courseParent->update(['status' => 'paid', 'paid_at' => now()]);
        $webinarTerm2->update(['status' => 'paid', 'paid_at' => now()]);
        $webinarParent->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertTrue($enrollmentCourse->fresh()->canDownloadCertificate());
        $this->assertTrue($enrollmentWebinar->fresh()->canDownloadCertificate());
        $this->assertTrue($courseParticipant->fresh()->isEligible());
        $this->assertTrue($webinarParticipant->fresh()->isEligible());

        $this->actingAs($this->buyer)
            ->get(route('profile.course.detail', $course->slug))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->where('certificateParticipant.certificate_code', $courseParticipant->certificate_code)
            );

        $this->actingAs($this->buyer)
            ->get(route('certificate.participant.detail', $courseParticipant->certificate_code))
            ->assertStatus(200);
        $this->actingAs($this->buyer)
            ->get(route('certificate.participant.detail', $webinarParticipant->certificate_code))
            ->assertStatus(200);

        $this->get(route('certificates.check', [
            'email' => $this->buyer->email,
            'phone_number' => $this->buyer->phone_number,
        ]))->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('user/check-certificate')
                ->has('participants', 2)
            );
    }

    public function test_gateway_dp_callback_does_not_create_certificate_participant_but_final_settlement_does()
    {
        $category = Category::create(['name' => 'Gateway Cert', 'slug' => 'gateway-cert']);
        $design = CertificateDesign::create(['name' => 'Design Gateway Cert']);
        $sign = CertificateSign::create(['name' => 'Sign Gateway Cert', 'position' => 'Director']);

        $course = Course::create([
            'category_id' => $category->id,
            'user_id' => $this->mentor->id,
            'title' => 'Gateway Flow Course',
            'slug' => 'gateway-flow-course',
            'price' => 600000,
            'strikethrough_price' => 0,
            'status' => 'published',
            'level' => 'beginner',
            'installment_enabled' => true,
        ]);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Mod 1', 'order' => 1]);
        $lesson = Lesson::create(['module_id' => $module->id, 'title' => 'Lesson 1', 'type' => 'text', 'order' => 1]);
        LessonCompletion::create(['user_id' => $this->buyer->id, 'lesson_id' => $lesson->id, 'completed_at' => now()]);
        CourseRating::create([
            'user_id' => $this->buyer->id,
            'course_id' => $course->id,
            'rating' => 5,
            'review' => 'Bagus',
            'status' => 'approved',
        ]);
        $certificate = Certificate::create([
            'design_id' => $design->id,
            'sign_id' => $sign->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-GW-001',
            'title' => 'Sertifikat Gateway Flow',
            'page_count' => 1,
            'second_page_grade' => false,
        ]);

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-GW-CERT-01',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        $term1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parent->id,
            'invoice_code' => 'TLT-GW-CERT-01-T1',
            'amount' => 300000,
            'nett_amount' => 300000,
            'installment_number' => 1,
            'status' => 'pending',
            'is_installment' => false,
            'installment_due_date' => Carbon::now()->addDays(5),
        ]);
        $term2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parent->id,
            'invoice_code' => 'TLT-GW-CERT-01-T2',
            'amount' => 300000,
            'nett_amount' => 300000,
            'installment_number' => 2,
            'status' => 'pending',
            'is_installment' => false,
            'installment_due_date' => Carbon::now()->addDays(20),
        ]);
        EnrollmentCourse::create([
            'invoice_id' => $parent->id,
            'course_id' => $course->id,
            'price' => 600000,
            'progress' => 100,
        ]);

        $this->postGatewayTermSettlement($term1)->assertStatus(200);
        $this->assertEquals('installment_pending', $parent->fresh()->status);
        $this->assertEquals(0, CertificateParticipant::where('certificate_id', $certificate->id)
            ->where('user_id', $this->buyer->id)
            ->count());

        $this->postGatewayTermSettlement($term2)->assertStatus(200);
        $this->assertEquals('paid', $parent->fresh()->status);

        $participant = CertificateParticipant::where('certificate_id', $certificate->id)
            ->where('user_id', $this->buyer->id)
            ->first();
        $this->assertNotNull($participant);
        $this->assertTrue($participant->isEligible());
        $this->actingAs($this->buyer)
            ->get(route('certificate.participant.detail', $participant->certificate_code))
            ->assertStatus(200);
    }
}
