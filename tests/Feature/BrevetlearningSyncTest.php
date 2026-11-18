<?php

use App\Models\Category;
use App\Models\CertificationProgram;
use App\Models\EnrollmentCertificationProgram;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

beforeEach(function () {
    config([
        'services.brevetlearning.url' => 'https://brevet.test',
        'services.brevetlearning.token' => 'rahasia-token',
        'services.brevetlearning.default_platform' => 'smartcounting-rwlqp',
    ]);
    cache()->flush();

    $category = Category::create(['name' => 'Pajak', 'slug' => 'pajak-'.Str::random(4)]);
    $this->program = CertificationProgram::create([
        'category_id' => $category->id,
        'title' => 'Pelatihan Brevet Pajak AB + CFTR Weekdays',
        'slug' => 'brevet-'.Str::random(6),
        'batch' => '42',
        'registration_deadline' => '2026-11-22 23:59:00',
        'type' => 'regular',
        'status' => 'published',
    ]);

    \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'admin']);
    $this->admin = User::factory()->create();
    $this->admin->assignRole('admin');
});

function brevetBuyer(CertificationProgram $program, string $email, string $status = 'paid', ?string $phone = '081211112222', bool $termPaid = true): User
{
    $user = User::factory()->create(['email' => $email, 'name' => Str::before($email, '@'), 'phone_number' => $phone]);
    $invoice = Invoice::create([
        'user_id' => $user->id, 'amount' => 855000, 'nett_amount' => 855000, 'status' => $status,
        'invoice_code' => 'SCA-'.Str::random(6), 'is_installment' => $status === 'installment_pending',
        'paid_at' => $status === 'paid' ? now() : null,
    ]);
    if ($status === 'installment_pending') {
        Invoice::create([
            'user_id' => $user->id, 'amount' => 300000, 'nett_amount' => 300000, 'status' => $termPaid ? 'paid' : 'pending',
            'invoice_code' => 'SCA-T'.Str::random(5), 'is_installment' => true,
            'parent_invoice_id' => $invoice->id, 'installment_number' => 1,
        ]);
    }
    EnrollmentCertificationProgram::create(['invoice_id' => $invoice->id, 'certification_program_id' => $program->id, 'price' => 855000]);

    return $user;
}

function fakeBrevet(array $inClass = [], ?callable $onEnroll = null): void
{
    Http::fake([
        'brevet.test/api/v1/integration/platforms' => Http::response(['data' => [['code' => 'smartcounting-rwlqp', 'name' => 'smartcounting']]]),
        'brevet.test/api/v1/integration/courses/lookup*' => function ($request) use (&$inClass) {
            if (!str_contains($request->url(), 'code=XHQwcrf4')) {
                return Http::response(['success' => false, 'message' => 'Kode kelas tidak ditemukan.'], 404);
            }

            return Http::response(['data' => [
                'code' => 'XHQwcrf4', 'name' => 'WEEKDAY 41', 'start_date' => '2026-11-11 00:00:00', 'end_date' => '2026-12-16 23:59:59',
                'participants_count' => count($inClass),
                'participants' => array_map(fn ($p) => ['name' => 'x', 'email' => $p[0], 'phone_number' => $p[1] ?? null, 'platform_code' => 'smartcounting-rwlqp'], $inClass),
            ]]);
        },
        'brevet.test/api/v1/integration/enroll' => function ($request) use (&$inClass, $onEnroll) {
            $onEnroll && $onEnroll($request->data());
            foreach ($request->data()['participants'] as $p) {
                $inClass[] = [$p['email'], $p['phone_number']];
            }

            return Http::response(['success' => true, 'summary' => ['created' => count($request->data()['participants'])],
                'results' => array_map(fn ($p) => ['email' => $p['email'], 'status' => 'created', 'message' => null], $request->data()['participants'])]);
        },
    ]);
}

it('menandai peserta yang sudah ada di kelas (email atau nomor HP) dan menghitung yang belum', function () {
    brevetBuyer($this->program, 'nabila@test.com');
    brevetBuyer($this->program, 'raihan@test.com', 'paid', '+62 812-3456-7890');
    brevetBuyer($this->program, 'cicil@test.com', 'installment_pending', '081299990000');
    brevetBuyer($this->program, 'belumbayar@test.com', 'installment_pending', '081288880000', termPaid: false);
    brevetBuyer($this->program, 'pending@test.com', 'pending');
    $this->program->update(['brevetlearning_course_code' => 'XHQwcrf4']);
    fakeBrevet([['NABILA@test.com', null], ['beda@test.com', '081234567890']]);

    $res = $this->actingAs($this->admin)->getJson(route('certification-programs.brevetlearning.status', $this->program))->assertOk();

    expect($res->json('summary'))->toBe(['eligible' => 3, 'in_class' => 2, 'missing' => 1])
        ->and($res->json('course.name'))->toBe('WEEKDAY 41')
        ->and($res->json('platform'))->toBe('smartcounting-rwlqp')
        ->and(collect($res->json('participants'))->firstWhere('email', 'cicil@test.com')['in_class'])->toBeFalse()
        ->and(collect($res->json('participants'))->firstWhere('email', 'cicil@test.com')['payment'])->toBe('installment')
        ->and(json_encode($res->json()))->not->toContain('rahasia-token');
});

it('menyimpan kode kelas setelah dicek dan menolak kode yang tidak ada', function () {
    fakeBrevet();
    $this->actingAs($this->admin);

    $this->postJson(route('certification-programs.brevetlearning.link', $this->program), ['course_code' => 'SALAH123'])
        ->assertStatus(422)->assertJsonPath('message', 'Kode kelas SALAH123 tidak ditemukan di brevetlearning.');

    $this->postJson(route('certification-programs.brevetlearning.link', $this->program), ['course_code' => 'XHQwcrf4', 'platform' => 'smartcounting-rwlqp'])
        ->assertOk()->assertJsonPath('course_code', 'XHQwcrf4');

    expect($this->program->fresh()->brevetlearning_course_code)->toBe('XHQwcrf4')
        ->and($this->program->fresh()->brevetlearning_platform)->toBe('smartcounting-rwlqp');

    $this->postJson(route('certification-programs.brevetlearning.link', $this->program), ['course_code' => ''])->assertOk();
    expect($this->program->fresh()->brevetlearning_course_code)->toBeNull();
});

it('mengirim hanya peserta yang belum ada di kelas, dengan platform induk', function () {
    brevetBuyer($this->program, 'sudah@test.com');
    brevetBuyer($this->program, 'susulan@test.com', 'paid', '081277778888');
    $this->program->update(['brevetlearning_course_code' => 'XHQwcrf4', 'brevetlearning_platform' => 'smartcounting-rwlqp']);
    $sent = null;
    fakeBrevet([['sudah@test.com', null]], function ($data) use (&$sent) { $sent = $data; });

    $res = $this->actingAs($this->admin)->postJson(route('certification-programs.brevetlearning.send', $this->program))->assertOk();

    expect($sent['course_code'])->toBe('XHQwcrf4')
        ->and($sent['platform_code'])->toBe('smartcounting-rwlqp')
        ->and(collect($sent['participants'])->pluck('email')->all())->toBe(['susulan@test.com'])
        ->and($res->json('result.summary.created'))->toBe(1)
        ->and($res->json('summary.missing'))->toBe(0);
    Http::assertSent(fn ($request) => $request->hasHeader('Authorization', 'Bearer rahasia-token'));
});

it('memberi status belum diatur bila env kosong dan menolak non-admin', function () {
    config(['services.brevetlearning.url' => null]);
    $this->actingAs($this->admin)->getJson(route('certification-programs.brevetlearning.status', $this->program))
        ->assertOk()->assertJsonPath('configured', false);

    $this->actingAs(User::factory()->create())->getJson(route('certification-programs.brevetlearning.status', $this->program))
        ->assertForbidden();
});

it('melaporkan galat brevetlearning tanpa membocorkan token', function () {
    $this->program->update(['brevetlearning_course_code' => 'XHQwcrf4']);
    Http::fake(['brevet.test/*' => Http::response(['message' => 'Unauthenticated.'], 401)]);

    $res = $this->actingAs($this->admin)->getJson(route('certification-programs.brevetlearning.status', $this->program))->assertOk();

    expect($res->json('error'))->toContain('Token brevetlearning ditolak')
        ->and(json_encode($res->json()))->not->toContain('rahasia-token');
});


it('panel memutus hubungan otomatis bila kelas sudah dihapus di brevetlearning', function () {
    $this->program->update(['brevetlearning_course_code' => 'HILANG01', 'brevetlearning_platform' => 'smartcounting-rwlqp']);
    fakeBrevet();

    $res = $this->actingAs($this->admin)->getJson(route('certification-programs.brevetlearning.status', $this->program))->assertOk();

    expect($res->json('course_code'))->toBeNull()
        ->and($res->json('notice'))->toContain('HILANG01')
        ->and($res->json('error'))->toBeNull()
        ->and($this->program->fresh()->brevetlearning_course_code)->toBeNull();
});

it('404 yang bukan jawaban brevetlearning tidak memutus hubungan', function () {
    $this->program->update(['brevetlearning_course_code' => 'XHQwcrf4']);
    Http::fake([
        'brevet.test/api/v1/integration/platforms' => Http::response(['data' => []]),
        'brevet.test/*' => Http::response('<html>Not Found</html>', 404),
    ]);

    $res = $this->actingAs($this->admin)->getJson(route('certification-programs.brevetlearning.status', $this->program))->assertOk();

    expect($res->json('error'))->toContain('BREVETLEARNING_API_URL')
        ->and($this->program->fresh()->brevetlearning_course_code)->toBe('XHQwcrf4');
});

it('prune-links memutus hanya kelas yang dihapus, dengan pengaman', function () {
    $lain = $this->program->replicate()->fill(['slug' => 'brevet-'.Str::random(6), 'batch' => '43']);
    $lain->save();
    $this->program->update(['brevetlearning_course_code' => 'XHQwcrf4']);
    $lain->update(['brevetlearning_course_code' => 'HILANG01']);
    fakeBrevet();

    $this->artisan('brevetlearning:prune-links --dry-run')->assertSuccessful();
    expect($lain->fresh()->brevetlearning_course_code)->toBe('HILANG01');

    $this->artisan('brevetlearning:prune-links')->assertSuccessful();
    expect($lain->fresh()->brevetlearning_course_code)->toBeNull()
        ->and($this->program->fresh()->brevetlearning_course_code)->toBe('XHQwcrf4');

    // Semua kode hilang sekaligus (≥2) → tidak ada yang diputus.
    $this->program->update(['brevetlearning_course_code' => 'HILANG02']);
    $lain->update(['brevetlearning_course_code' => 'HILANG03']);
    $this->artisan('brevetlearning:prune-links')->assertFailed();
    expect($this->program->fresh()->brevetlearning_course_code)->toBe('HILANG02')
        ->and($lain->fresh()->brevetlearning_course_code)->toBe('HILANG03');
});

it('prune-links batal total bila token ditolak', function () {
    $this->program->update(['brevetlearning_course_code' => 'XHQwcrf4']);
    Http::fake(['brevet.test/*' => Http::response(['message' => 'Unauthenticated.'], 401)]);

    $this->artisan('brevetlearning:prune-links')->assertFailed();
    expect($this->program->fresh()->brevetlearning_course_code)->toBe('XHQwcrf4');
});
