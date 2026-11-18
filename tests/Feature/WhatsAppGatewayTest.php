<?php

use App\Services\WhatsApp\MessaraGateway;
use App\Services\WhatsApp\WablasGateway;
use App\Services\WhatsApp\WhatsApp;
use App\Services\WhatsApp\SendStatus;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;

beforeEach(function () {
    config([
        'services.whatsapp.messara.domain' => 'https://messara.test',
        'services.whatsapp.messara.api_key' => 'MSR-KEY',
        'services.whatsapp.messara.secret_key' => 'MSR-SECRET',
        'services.whatsapp.messara.sender_number' => null,
        'services.whatsapp.wablas.domain' => 'https://wablas.test',
        'services.whatsapp.wablas.token' => 'WBL-TOKEN',
        'services.whatsapp.wablas.secret' => 'WBL-SECRET',
        'services.whatsapp.wablas.sender_number' => null,
        'services.whatsapp.dedupe_ttl' => 600,
        'services.whatsapp.gateway' => 'messara',
        'services.whatsapp.primary_sender_number' => null,
    ]);
});

function waItem(string $message = 'Pembayaran INV-001 berhasil', string $phone = '628111'): array
{
    return [['phone' => $phone, 'message' => $message, 'isGroup' => 'false']];
}

/** Respons Messara versi baru: hasil per ref_id dari request yang masuk. */
function messaraReply(string $itemStatus = 'sent', int $http = 200): Closure
{
    return function (Request $request) use ($itemStatus, $http) {
        $results = array_map(fn ($row) => ['phone' => $row['phone'], 'ref_id' => $row['ref_id'], 'status' => $itemStatus] + ($itemStatus === 'failed' ? ['reason' => 'daily_limit_reached'] : []), $request['data']);
        $ok = $itemStatus !== 'failed';

        return Http::response(['status' => $ok, 'data' => ['success' => $ok ? count($results) : 0, 'failed' => $ok ? 0 : count($results), 'results' => $results]], $http);
    };
}

// --- 1. Messara: status palsu & klasifikasi hasil ---

it('menganggap gagal bila Messara versi lama membalas status true tapi 0 pesan terkirim', function () {
    Http::fake(['messara.test/*' => Http::response(['status' => true, 'data' => ['success' => 0, 'failed' => 1]])]);

    $result = MessaraGateway::sendTextResult(waItem());

    expect($result->status)->toBe(SendStatus::Failed)
        ->and(MessaraGateway::sendTextResult(waItem())->isSent())->toBeFalse();
});

it('membaca hasil per pesan dari Messara baru (HTTP 422 + reason)', function () {
    Http::fake(['messara.test/*' => messaraReply('failed', 422)]);

    $result = MessaraGateway::sendTextResult(waItem());

    expect($result->status)->toBe(SendStatus::Failed)
        ->and($result->items[0]['reason'])->toBe('daily_limit_reached');
});

it('mengirim ref_id per pesan serta header otentikasi Messara', function () {
    Http::fake(['messara.test/*' => messaraReply()]);

    expect(MessaraGateway::sendTextResult(waItem())->isSent())->toBeTrue();

    Http::assertSent(fn (Request $r) => $r->url() === 'https://messara.test/api/v2/send-message'
        && $r->header('Authorization')[0] === 'MSR-KEY.MSR-SECRET'
        && filled($r['data'][0]['ref_id']));
});

it('mengklasifikasikan koneksi gagal sebagai Failed dan timeout sebagai Uncertain', function () {
    Http::fake(fn (Request $r) => throw new ConnectionException($r['data'][0]['message'] === 'a'
        ? 'cURL error 7: Failed to connect to messara.test port 443'
        : 'cURL error 28: Operation timed out after 30001 milliseconds with 0 bytes received'));

    expect(MessaraGateway::sendTextResult(waItem('a'))->status)->toBe(SendStatus::Failed)
        ->and(MessaraGateway::sendTextResult(waItem('b'))->status)->toBe(SendStatus::Uncertain);
});

it('menganggap 502/503 pasti gagal, 500/504 tidak pasti', function (int $code, SendStatus $expected) {
    Http::fake(['messara.test/*' => Http::response('error', $code)]);

    expect(MessaraGateway::sendTextResult(waItem("pesan {$code}"))->status)->toBe($expected);
})->with([
    [502, SendStatus::Failed],
    [503, SendStatus::Failed],
    [500, SendStatus::Uncertain],
    [504, SendStatus::Uncertain],
]);

// --- 2. Risiko pesan ganda ---

it('tidak mengirim pesan identik dua kali ke nomor yang sama', function () {
    Http::fake(['messara.test/*' => messaraReply()]);

    expect(MessaraGateway::sendTextResult(waItem())->isSent())->toBeTrue()
        ->and(MessaraGateway::sendTextResult(waItem())->isSent())->toBeTrue();

    Http::assertSentCount(1);
});

it('mencegah dobel lintas gateway: pesan yang sudah terkirim via Messara tidak dikirim lagi via Wablas', function () {
    Http::fake(['messara.test/*' => messaraReply(), 'wablas.test/*' => Http::response(['status' => true])]);

    MessaraGateway::sendTextResult(waItem())->isSent();
    $wablas = WablasGateway::sendTextResult(waItem());

    expect($wablas->isSent())->toBeTrue()->and($wablas->items[0]['duplicate'])->toBeTrue();
    Http::assertSentCount(1);
});

it('boleh mengirim ulang bila percobaan sebelumnya pasti gagal', function () {
    Http::fakeSequence('messara.test/*')
        ->push(['status' => false, 'message' => 'device offline'])
        ->push(['status' => true]);

    expect(MessaraGateway::sendTextResult(waItem())->isSent())->toBeFalse()
        ->and(MessaraGateway::sendTextResult(waItem())->isSent())->toBeTrue();

    Http::assertSentCount(2);
});

it('tidak mengirim ulang setelah hasil tidak pasti (timeout) supaya tidak dobel', function () {
    Http::fakeSequence('messara.test/*')
        ->pushResponse(Http::response('gateway timeout', 504))
        ->push(['status' => true]);

    expect(MessaraGateway::sendTextResult(waItem())->status)->toBe(SendStatus::Uncertain);
    expect(MessaraGateway::sendTextResult(waItem())->isSent())->toBeTrue();

    Http::assertSentCount(1);
});

it('anti-duplikat bisa dimatikan dengan WA_DEDUPE_TTL=0', function () {
    config(['services.whatsapp.dedupe_ttl' => 0]);
    Http::fake(['messara.test/*' => messaraReply()]);

    MessaraGateway::sendTextResult(waItem())->isSent();
    MessaraGateway::sendTextResult(waItem())->isSent();

    Http::assertSentCount(2);
});

it('tidak fallback ke teks saat template invoice hasilnya tidak pasti', function () {
    Http::fake(['messara.test/*' => Http::response('timeout', 504)]);

    $result = MessaraGateway::sendTemplateResult([['phone' => '628111', 'template_name' => 'invoice_pembayaran_berhasil', 'params' => ['A']]]);

    expect($result->status)->toBe(SendStatus::Uncertain)
        ->and($result->status !== SendStatus::Failed)->toBeTrue();
});

// --- 3. Nomor pengirim berbeda ---

it('menambahkan catatan nomor lain bila gateway memakai nomor selain nomor utama', function () {
    config([
        'app.name' => 'Aksademy',
        'services.whatsapp.primary_sender_number' => '0851-4250-5794',
        'services.whatsapp.wablas.sender_number' => '628999',
    ]);
    Http::fake(['wablas.test/*' => Http::response(['status' => true])]);

    WablasGateway::sendTextResult(waItem('Halo'))->isSent();

    Http::assertSent(fn (Request $r) => str_starts_with($r['data'][0]['message'], "Halo\n\n")
        && str_contains($r['data'][0]['message'], 'nomor lain milik Aksademy')
        && str_contains($r['data'][0]['message'], 'wa.me/6285142505794'));
});

it('tidak menambahkan catatan bila nomor gateway sama dengan nomor utama', function () {
    config([
        'services.whatsapp.primary_sender_number' => '6285142505794',
        'services.whatsapp.messara.sender_number' => '085142505794',
    ]);
    Http::fake(['messara.test/*' => messaraReply()]);

    MessaraGateway::sendTextResult(waItem('Halo'))->isSent();

    Http::assertSent(fn (Request $r) => $r['data'][0]['message'] === 'Halo');
});

// --- 4. Wablas membaca config ---

it('Wablas memakai config (aman dengan config:cache), bukan env()', function () {
    Http::fake(['wablas.test/*' => Http::response(['status' => true])]);

    expect(WablasGateway::sendTextResult(waItem())->isSent())->toBeTrue();

    Http::assertSent(fn (Request $r) => $r->url() === 'https://wablas.test/api/v2/send-message'
        && $r->header('Authorization')[0] === 'WBL-TOKEN.WBL-SECRET');
});

it('Wablas gagal dengan jelas bila kredensial di config kosong', function () {
    config(['services.whatsapp.wablas.token' => null]);
    Http::fake();

    expect(WablasGateway::sendTextResult(waItem())->reason)->toBe('missing_credentials');
    Http::assertNothingSent();
});

// --- Switch gateway (DEFAULT_WA_GATEWAY) ---

it('default gateway adalah messara', function () {
    config(['services.whatsapp.gateway' => null]);
    expect(WhatsApp::gateway())->toBe('messara');

    config(['services.whatsapp.gateway' => 'tidak-dikenal']);
    expect(WhatsApp::gateway())->toBe('messara');
});

it('mengirim lewat messara saat DEFAULT_WA_GATEWAY=messara', function () {
    Http::fake(['messara.test/*' => messaraReply(), 'wablas.test/*' => Http::response(['status' => true])]);

    expect(WhatsApp::sendText(waItem()))->toBeTrue();

    Http::assertSent(fn (Request $r) => str_starts_with($r->url(), 'https://messara.test/'));
    Http::assertNotSent(fn (Request $r) => str_starts_with($r->url(), 'https://wablas.test/'));
});

it('pindah ke wablas cukup dengan DEFAULT_WA_GATEWAY=wablas', function () {
    config(['services.whatsapp.gateway' => 'Wablas ']);
    Http::fake(['messara.test/*' => messaraReply(), 'wablas.test/*' => Http::response(['status' => true])]);

    $result = WhatsApp::sendTextResult(waItem());

    expect($result->gateway)->toBe('wablas')->and($result->isSent())->toBeTrue();
    Http::assertNotSent(fn (Request $r) => str_starts_with($r->url(), 'https://messara.test/'));
});

it('template dianggap gagal di wablas sehingga pemanggil fallback ke teks', function () {
    config(['services.whatsapp.gateway' => 'wablas']);
    Http::fake();

    $result = WhatsApp::sendTemplateResult([['phone' => '628111', 'template_name' => 'x']]);

    expect($result->status)->toBe(SendStatus::Failed)->and($result->reason)->toBe('template_unsupported');
    Http::assertNothingSent();
});
