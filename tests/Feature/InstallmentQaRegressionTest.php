<?php

namespace Tests\Feature;

use App\Http\Controllers\AdminController;
use App\Models\Bootcamp;
use App\Models\Bundle;
use App\Models\BundleItem;
use App\Models\Category;
use App\Models\Certificate;
use App\Models\CertificateDesign;
use App\Models\CertificateParticipant;
use App\Models\CertificateSign;
use App\Models\CertificationProgram;
use App\Models\Course;
use App\Models\CourseRating;
use App\Models\EnrollmentBootcamp;
use App\Models\EnrollmentBundle;
use App\Models\EnrollmentCertificationProgram;
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

class InstallmentQaRegressionTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $mentor;
    protected User $buyer;
    protected User $unpaidBuyer;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();

        Role::firstOrCreate(['name' => 'admin']);
        Role::firstOrCreate(['name' => 'mentor']);
        Role::firstOrCreate(['name' => 'user']);
        Role::firstOrCreate(['name' => 'affiliate']);

        $this->admin = User::factory()->create(['email' => 'admin@qa.test']);
        $this->admin->assignRole('admin');

        $this->mentor = User::factory()->create(['email' => 'mentor@qa.test']);
        $this->mentor->assignRole('mentor');

        $this->buyer = User::factory()->create([
            'email' => 'buyer@qa.test',
            'phone_number' => '08123456789',
        ]);
        $this->buyer->assignRole('user');

        $this->unpaidBuyer = User::factory()->create([
            'email' => 'unpaid@qa.test',
            'phone_number' => '08987654321',
        ]);
        $this->unpaidBuyer->assignRole('user');
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

    public function test_course_checkout_allows_unverified_user_and_register_supports_json()
    {
        $category = Category::create(['name' => 'Pajak QA', 'slug' => 'pajak-qa']);
        $course = Course::create([
            'category_id' => $category->id,
            'user_id' => $this->mentor->id,
            'title' => 'Kelas Online QA',
            'slug' => 'kelas-online-qa',
            'price' => 500000,
            'strikethrough_price' => 0,
            'status' => 'published',
            'level' => 'beginner',
            'installment_enabled' => true,
        ]);

        $this->get(route('course.checkout', $course->slug))->assertStatus(200);

        $unverified = User::factory()->unverified()->create([
            'email' => 'unverified@qa.test',
            'phone_number' => '08129998887',
        ]);
        $unverified->assignRole('user');

        $this->actingAs($unverified)
            ->get(route('course.checkout', $course->slug))
            ->assertStatus(200);

        auth()->logout();
        $registerResponse = $this->postJson('/register', [
            'name' => 'Inline Guest User',
            'email' => 'inlineguest@qa.test',
            'phone_number' => '08127776665',
            'instance' => 'Instansi QA',
            'city' => 'Jakarta',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $registerResponse->assertStatus(200)
            ->assertJson(['success' => true]);
        $this->assertDatabaseHas('users', ['email' => 'inlineguest@qa.test']);
        $this->assertAuthenticated();
    }

    public function test_legacy_profile_course_redirect_and_progress_recalculation_without_premature_certificate()
    {
        $category = Category::create(['name' => 'Course QA', 'slug' => 'course-qa']);
        $design = CertificateDesign::create(['name' => 'Design QA Course']);
        $sign = CertificateSign::create(['name' => 'Sign QA Course', 'position' => 'Director']);

        $course = Course::create([
            'category_id' => $category->id,
            'user_id' => $this->mentor->id,
            'title' => 'Course Progress QA',
            'slug' => 'course-progress-qa',
            'price' => 600000,
            'strikethrough_price' => 0,
            'status' => 'published',
            'level' => 'beginner',
            'installment_enabled' => true,
        ]);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Mod 1', 'order' => 1]);
        $lesson = Lesson::create(['module_id' => $module->id, 'title' => 'Lesson 1', 'type' => 'text', 'order' => 1]);
        LessonCompletion::create([
            'user_id' => $this->buyer->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);
        CourseRating::create([
            'user_id' => $this->buyer->id,
            'course_id' => $course->id,
            'rating' => 5,
            'review' => 'Sangat bagus',
            'status' => 'approved',
        ]);
        $certificate = Certificate::create([
            'design_id' => $design->id,
            'sign_id' => $sign->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-QA-PROG-001',
            'title' => 'Sertifikat Progress QA',
            'page_count' => 1,
            'second_page_grade' => false,
        ]);

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-QA-PROG-01',
            'amount' => 600000,
            'nett_amount' => 600000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parent->id,
            'invoice_code' => 'TLT-QA-PROG-01-T1',
            'amount' => 300000,
            'nett_amount' => 300000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);
        $term2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parent->id,
            'invoice_code' => 'TLT-QA-PROG-01-T2',
            'amount' => 300000,
            'nett_amount' => 300000,
            'installment_number' => 2,
            'status' => 'pending',
            'is_installment' => false,
        ]);

        $enrollment = EnrollmentCourse::create([
            'invoice_id' => $parent->id,
            'course_id' => $course->id,
            'price' => 600000,
            'progress' => 0,
        ]);

        $this->actingAs($this->buyer)
            ->get("/profile/course/{$course->slug}")
            ->assertRedirect("/profile/my-courses/{$course->slug}");

        $this->actingAs($this->buyer)
            ->get(route('profile.course.detail', $course->slug))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('user/profile/course/detail')
                ->where('certificateParticipant', null)
            );

        $this->assertEquals(100, (int) $enrollment->fresh()->progress);
        $this->assertEquals(0, CertificateParticipant::where('certificate_id', $certificate->id)
            ->where('user_id', $this->buyer->id)
            ->count());

        $term2->update(['status' => 'paid', 'paid_at' => now()]);
        $parent->update(['status' => 'paid', 'paid_at' => now()]);

        $this->actingAs($this->buyer)
            ->get(route('profile.course.detail', $course->slug))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('user/profile/course/detail')
                ->where('certificateParticipant.user_id', $this->buyer->id)
            );
    }

    public function test_admin_dp_participants_and_non_double_counting_revenue()
    {
        $category = Category::create(['name' => 'Admin QA', 'slug' => 'admin-qa']);

        $bootcamp = Bootcamp::create([
            'title' => 'Bootcamp DP QA',
            'slug' => 'bootcamp-dp-qa',
            'price' => 800000,
            'category_id' => $category->id,
            'start_date' => now()->addDays(5),
            'end_date' => now()->addDays(10),
            'status' => 'published',
            'quota' => 50,
            'installment_enabled' => true,
        ]);

        $webinar = Webinar::create([
            'user_id' => $this->mentor->id,
            'category_id' => $category->id,
            'title' => 'Webinar DP QA',
            'slug' => 'webinar-dp-qa',
            'price' => 300000,
            'start_time' => now()->addDays(5),
            'end_time' => now()->addDays(5)->addHours(2),
            'status' => 'published',
            'quota' => 50,
            'installment_enabled' => true,
        ]);

        $program = CertificationProgram::create([
            'category_id' => $category->id,
            'title' => 'Cert DP QA',
            'slug' => 'cert-dp-qa',
            'price' => 1000000,
            'type' => 'regular',
            'status' => 'published',
            'installment_enabled' => true,
        ]);

        $bootParentPaid = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-ADM-B1',
            'amount' => 800000,
            'nett_amount' => 800000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $bootParentPaid->id,
            'invoice_code' => 'TLT-ADM-B1-T1',
            'amount' => 400000,
            'nett_amount' => 400000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);
        EnrollmentBootcamp::create(['invoice_id' => $bootParentPaid->id, 'bootcamp_id' => $bootcamp->id, 'price' => 800000]);

        $bootParentUnpaid = Invoice::create([
            'user_id' => $this->unpaidBuyer->id,
            'invoice_code' => 'TLT-ADM-B2',
            'amount' => 800000,
            'nett_amount' => 800000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->unpaidBuyer->id,
            'parent_invoice_id' => $bootParentUnpaid->id,
            'invoice_code' => 'TLT-ADM-B2-T1',
            'amount' => 400000,
            'nett_amount' => 400000,
            'installment_number' => 1,
            'status' => 'pending',
            'is_installment' => false,
        ]);
        EnrollmentBootcamp::create(['invoice_id' => $bootParentUnpaid->id, 'bootcamp_id' => $bootcamp->id, 'price' => 800000]);

        $webParentPaid = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-ADM-W1',
            'amount' => 300000,
            'nett_amount' => 300000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $webParentPaid->id,
            'invoice_code' => 'TLT-ADM-W1-T1',
            'amount' => 150000,
            'nett_amount' => 150000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);
        EnrollmentWebinar::create(['invoice_id' => $webParentPaid->id, 'webinar_id' => $webinar->id, 'price' => 300000]);

        $webParentUnpaid = Invoice::create([
            'user_id' => $this->unpaidBuyer->id,
            'invoice_code' => 'TLT-ADM-W2',
            'amount' => 300000,
            'nett_amount' => 300000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->unpaidBuyer->id,
            'parent_invoice_id' => $webParentUnpaid->id,
            'invoice_code' => 'TLT-ADM-W2-T1',
            'amount' => 150000,
            'nett_amount' => 150000,
            'installment_number' => 1,
            'status' => 'pending',
            'is_installment' => false,
        ]);
        EnrollmentWebinar::create(['invoice_id' => $webParentUnpaid->id, 'webinar_id' => $webinar->id, 'price' => 300000]);

        $certParentPaid = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-ADM-C1',
            'amount' => 1000000,
            'nett_amount' => 1000000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $certParentPaid->id,
            'invoice_code' => 'TLT-ADM-C1-T1',
            'amount' => 500000,
            'nett_amount' => 500000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);
        EnrollmentCertificationProgram::create(['invoice_id' => $certParentPaid->id, 'certification_program_id' => $program->id, 'price' => 1000000]);

        $this->actingAs($this->admin)->get(route('bootcamps.show', $bootcamp->id))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->has('participants', 1));

        $this->actingAs($this->admin)->get(route('bootcamps.index'))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->where('statistics.performance.total_enrollments', 1)
                ->where('statistics.performance.total_revenue', 800000)
            );

        $this->actingAs($this->admin)->get(route('webinars.show', $webinar->id))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->has('participants', 1));

        $this->actingAs($this->admin)->get(route('certification-programs.show', $program->id))
            ->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page->has('applications', 1));

        $fullParent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-ADM-FULL',
            'amount' => 1000000,
            'nett_amount' => 1000000,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => true,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $fullParent->id,
            'invoice_code' => 'TLT-ADM-FULL-T1',
            'amount' => 400000,
            'nett_amount' => 400000,
            'installment_number' => 1,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);
        Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $fullParent->id,
            'invoice_code' => 'TLT-ADM-FULL-T2',
            'amount' => 600000,
            'nett_amount' => 600000,
            'installment_number' => 2,
            'status' => 'paid',
            'paid_at' => now(),
            'is_installment' => false,
        ]);

        $adminController = app(AdminController::class);
        $paidQueryMethod = new \ReflectionMethod($adminController, 'paidPaymentsQuery');
        $paidQueryMethod->setAccessible(true);

        $totalPaidRevenue = (int) $paidQueryMethod->invoke($adminController)->sum('nett_amount');
        $this->assertEquals(2050000, $totalPaidRevenue);
    }

    public function test_bundle_installment_dp_creates_enrollments_without_certificates_and_settlement_creates_certificates()
    {
        $category = Category::create(['name' => 'Bundle QA', 'slug' => 'bundle-qa']);
        $design = CertificateDesign::create(['name' => 'Design Bundle QA']);
        $sign = CertificateSign::create(['name' => 'Sign Bundle QA', 'position' => 'Director']);

        $course = Course::create([
            'category_id' => $category->id,
            'user_id' => $this->mentor->id,
            'title' => 'Bundled Course QA',
            'slug' => 'bundled-course-qa',
            'price' => 600000,
            'strikethrough_price' => 0,
            'status' => 'published',
            'level' => 'beginner',
        ]);
        $module = Module::create(['course_id' => $course->id, 'title' => 'Mod 1', 'order' => 1]);
        $lesson = Lesson::create(['module_id' => $module->id, 'title' => 'Lesson 1', 'type' => 'text', 'order' => 1]);
        LessonCompletion::create([
            'user_id' => $this->buyer->id,
            'lesson_id' => $lesson->id,
            'completed_at' => now(),
        ]);

        $bootcamp = Bootcamp::create([
            'category_id' => $category->id,
            'title' => 'Bundled Bootcamp QA',
            'slug' => 'bundled-bootcamp-qa',
            'price' => 400000,
            'start_date' => now()->subDays(10),
            'end_date' => now()->subDays(2),
            'status' => 'published',
            'has_certificate' => true,
            'requires_review' => false,
        ]);

        $courseCert = Certificate::create([
            'design_id' => $design->id,
            'sign_id' => $sign->id,
            'course_id' => $course->id,
            'certificate_number' => 'CERT-BND-CRS-001',
            'title' => 'Sertifikat Bundle Course',
            'page_count' => 1,
            'second_page_grade' => false,
        ]);
        $bootcampCert = Certificate::create([
            'design_id' => $design->id,
            'sign_id' => $sign->id,
            'bootcamp_id' => $bootcamp->id,
            'certificate_number' => 'CERT-BND-BOOT-001',
            'title' => 'Sertifikat Bundle Bootcamp',
            'page_count' => 1,
            'second_page_grade' => false,
        ]);

        $bundle = Bundle::create([
            'user_id' => $this->mentor->id,
            'title' => 'Paket Bundle QA',
            'slug' => 'paket-bundle-qa',
            'price' => 1000000,
            'status' => 'published',
            'installment_enabled' => true,
        ]);
        BundleItem::create([
            'bundle_id' => $bundle->id,
            'bundleable_type' => Course::class,
            'bundleable_id' => $course->id,
            'order' => 1,
            'price' => 600000,
        ]);
        BundleItem::create([
            'bundle_id' => $bundle->id,
            'bundleable_type' => Bootcamp::class,
            'bundleable_id' => $bootcamp->id,
            'order' => 2,
            'price' => 400000,
        ]);

        $parent = Invoice::create([
            'user_id' => $this->buyer->id,
            'invoice_code' => 'TLT-BND-001',
            'amount' => 1000000,
            'nett_amount' => 1000000,
            'status' => 'installment_pending',
            'is_installment' => true,
        ]);
        EnrollmentBundle::create([
            'invoice_id' => $parent->id,
            'bundle_id' => $bundle->id,
            'price' => 1000000,
        ]);
        $term1 = Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parent->id,
            'invoice_code' => 'TLT-BND-001-T1',
            'amount' => 500000,
            'nett_amount' => 500000,
            'installment_number' => 1,
            'status' => 'pending',
            'is_installment' => false,
            'installment_due_date' => Carbon::now()->addDays(5),
        ]);
        $term2 = Invoice::create([
            'user_id' => $this->buyer->id,
            'parent_invoice_id' => $parent->id,
            'invoice_code' => 'TLT-BND-001-T2',
            'amount' => 500000,
            'nett_amount' => 500000,
            'installment_number' => 2,
            'status' => 'pending',
            'is_installment' => false,
            'installment_due_date' => Carbon::now()->addDays(20),
        ]);

        $this->postGatewayTermSettlement($term1)->assertStatus(200);
        $this->assertEquals('installment_pending', $parent->fresh()->status);

        $enrollCourse = EnrollmentCourse::where('invoice_id', $parent->id)->where('course_id', $course->id)->first();
        $enrollBoot = EnrollmentBootcamp::where('invoice_id', $parent->id)->where('bootcamp_id', $bootcamp->id)->first();
        $this->assertNotNull($enrollCourse);
        $this->assertNotNull($enrollBoot);

        $enrollCourse->update(['progress' => 100]);
        $this->assertFalse($enrollCourse->fresh()->canDownloadCertificate());
        $this->assertFalse($enrollBoot->fresh()->canDownloadCertificate());
        $this->assertEquals(0, CertificateParticipant::where('user_id', $this->buyer->id)->count());

        $this->postGatewayTermSettlement($term2)->assertStatus(200);
        $this->assertEquals('paid', $parent->fresh()->status);

        $this->assertTrue($enrollCourse->fresh()->canDownloadCertificate());
        $this->assertTrue($enrollBoot->fresh()->canDownloadCertificate());

        $cpCourse = CertificateParticipant::where('certificate_id', $courseCert->id)->where('user_id', $this->buyer->id)->first();
        $cpBoot = CertificateParticipant::where('certificate_id', $bootcampCert->id)->where('user_id', $this->buyer->id)->first();
        $this->assertNotNull($cpCourse);
        $this->assertNotNull($cpBoot);
        $this->assertTrue($cpCourse->isEligible());
        $this->assertTrue($cpBoot->isEligible());
        $this->actingAs($this->buyer)->get(route('certificate.participant.detail', $cpBoot->certificate_code))->assertStatus(200);
    }

    public function test_course_installment_full_qa_flow_guest_unverified_past_course_profile_wa_and_admin_enrollments()
    {
        \Illuminate\Support\Facades\Http::fake([
            '*' => \Illuminate\Support\Facades\Http::response(['status' => true, 'message' => 'OK'], 200),
        ]);

        $mockMidtrans = \Mockery::mock(\App\Services\MidtransService::class);
        $mockMidtrans->shouldReceive('createTransaction')
            ->once()
            ->andReturn([
                'success' => true,
                'redirect_url' => 'https://mock.payment.com/checkout/course-qa-url',
                'snap_token' => 'mock-snap-course-qa',
            ]);
        $this->app->instance(\App\Services\MidtransService::class, $mockMidtrans);

        $category = Category::create(['name' => 'Course Full QA', 'slug' => 'course-full-qa']);

        // Course created in the past with past template term due_dates
        $course = Course::create([
            'category_id' => $category->id,
            'user_id' => $this->mentor->id,
            'title' => 'Kelas Online Pajak Terpadu',
            'slug' => 'kelas-online-pajak-terpadu',
            'price' => 600000,
            'strikethrough_price' => 800000,
            'status' => 'published',
            'level' => 'beginner',
            'installment_enabled' => true,
            'created_at' => Carbon::now()->subMonths(3),
        ]);

        \App\Models\ProductInstallmentTerm::create([
            'termable_type' => Course::class,
            'termable_id' => $course->id,
            'term_number' => 1,
            'amount' => 300000,
            'due_date' => Carbon::now()->subMonths(3)->format('Y-m-d'),
        ]);
        \App\Models\ProductInstallmentTerm::create([
            'termable_type' => Course::class,
            'termable_id' => $course->id,
            'term_number' => 2,
            'amount' => 300000,
            'due_date' => Carbon::now()->subMonths(2)->format('Y-m-d'),
        ]);

        // 1. Guest User can access /course/{slug} and /course/{slug}/checkout without 403 or crash
        $this->get(route('course.detail', ['course' => $course->slug]))->assertStatus(200);
        $this->get(route('course.checkout', ['course' => $course->slug]))->assertStatus(200);

        // 2. Unverified User (email_verified_at = null) can open checkout and create installment for past-created course
        $unverifiedBuyer = User::factory()->create([
            'name' => 'Unverified Course Buyer',
            'email' => 'unverified-course@test.com',
            'phone_number' => '081234567899',
            'email_verified_at' => null,
        ]);
        $unverifiedBuyer->assignRole('user');

        $this->actingAs($unverifiedBuyer)
            ->get(route('course.checkout', ['course' => $course->slug]))
            ->assertStatus(200);

        $storeResp = $this->actingAs($unverifiedBuyer)
            ->postJson('/invoice/installment', [
                'type' => 'course',
                'id' => $course->id,
            ]);
        $storeResp->assertStatus(200)->assertJson(['success' => true]);

        $parentId = $storeResp->json('invoice_id');
        $parent = Invoice::with('installmentTerms')->findOrFail($parentId);
        $term1 = $parent->installmentTerms->firstWhere('installment_number', 1);
        $term2 = $parent->installmentTerms->firstWhere('installment_number', 2);

        $this->assertTrue(Carbon::parse($term1->installment_due_date)->endOfDay()->gte(Carbon::now('Asia/Jakarta')));
        $this->assertTrue(Carbon::parse($term2->installment_due_date)->endOfDay()->gt(Carbon::now('Asia/Jakarta')));

        // 3. Pay Termin 1 (DP) via Midtrans callback
        $this->postGatewayTermSettlement($term1)->assertStatus(200);

        $enrollment = EnrollmentCourse::where('invoice_id', $parent->id)->first();
        $this->assertNotNull($enrollment);
        $this->assertEquals(0, (int) $enrollment->progress);
        $this->assertNull($enrollment->completed_at);

        // 4. Access "Profil Saya" (/profile/dashboard) and "/profile/course/{slug}" after Termin 1 paid
        $this->actingAs($unverifiedBuyer)->get(route('profile.index'))->assertStatus(200);
        $this->actingAs($unverifiedBuyer)->get('/profile/course/' . $course->slug)->assertRedirect('/profile/my-courses/' . $course->slug);
        $this->actingAs($unverifiedBuyer)->get(route('profile.course.detail', ['course' => $course->slug]))->assertStatus(200);

        // 5. Admin Course Enrollments & Transactions after DP
        $this->actingAs($this->admin)->get('/admin/courses/' . $course->id . '/enrollments')->assertRedirect('/admin/courses/' . $course->id);
        $this->actingAs($this->admin)->get(route('courses.show', $course->id))->assertStatus(200);
        $this->actingAs($this->admin)->get(route('courses.index'))->assertStatus(200);

        // 6. Final Term (Pelunasan) WhatsApp message contains LUNAS and direct link to /profile/my-courses/{slug}
        $term2->update(['status' => 'paid', 'paid_at' => Carbon::now()]);
        $parent->update(['status' => 'paid', 'paid_at' => Carbon::now()]);

        $invoiceController = app(\App\Http\Controllers\InvoiceController::class);
        $ref = new \ReflectionMethod($invoiceController, 'createWhatsAppInstallmentMessage');
        $ref->setAccessible(true);
        $waCompleteMessage = $ref->invoke($invoiceController, $term2->fresh(), $parent->fresh(), true);

        $this->assertStringContainsString('LUNAS', $waCompleteMessage);
        $this->assertStringContainsString($course->title, $waCompleteMessage);
        $this->assertStringContainsString('/profile/my-courses/' . $course->slug, $waCompleteMessage);

        $midtransController = app(\App\Http\Controllers\MidtransCallbackController::class);
        $refM = new \ReflectionMethod($midtransController, 'createWhatsAppInstallmentMessage');
        $refM->setAccessible(true);
        $waMidtransMessage = $refM->invoke($midtransController, $term2->fresh(), $parent->fresh(), true);
        $this->assertStringContainsString('/profile/my-courses/' . $course->slug, $waMidtransMessage);
    }
}
