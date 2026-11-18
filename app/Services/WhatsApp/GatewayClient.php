<?php

namespace App\Services\WhatsApp;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

/**
 * Pengirim HTTP bersama untuk gateway berformat Wablas (Wablas & Messara):
 * POST {data: [...]} dengan Authorization TOKEN.SECRET.
 *
 * Tugasnya:
 * - mencegah pesan ganda (MessageDeduplicator) dan memberi `ref_id` per pesan (idempotensi di Messara),
 * - menandai pesan teks dari nomor cadangan (SenderIdentity),
 * - mengklasifikasikan hasil menjadi Sent / Failed / Uncertain.
 */
final class GatewayClient
{
    /** Pola error cURL yang terjadi SEBELUM request terkirim (DNS, koneksi ditolak, connect timeout, SSL handshake). */
    private const CONNECT_FAILURE_PATTERN = '/cURL error (6|7|35):|Could not resolve host|Failed to connect|Connection refused|Connection timed out after|Resolving timed out/i';

    /** 5xx yang berarti gateway tidak memproses request sama sekali. */
    private const UNPROCESSED_SERVER_ERRORS = [502, 503];

    /**
     * @param  array<int|string, mixed>  $data  satu item ['phone' => ..] atau daftar item
     * @param  'text'|'template'  $kind
     */
    public static function deliver(string $gateway, string $url, array $headers, array $data, string $kind, ?string $senderNumber = null): SendResult
    {
        if (isset($data['phone'])) {
            $data = [$data];
        }

        $items = [];
        $outgoing = [];

        foreach (array_values($data) as $row) {
            $row = (array) $row;
            $phone = (string) ($row['phone'] ?? '');

            if ($phone === '' || ! self::hasContent($kind, $row)) {
                $items[] = self::item($phone, SendStatus::Failed, 'invalid_payload', null);

                continue;
            }

            $dedupeKey = MessageDeduplicator::key($phone, self::fingerprint($kind, $row));

            if (! MessageDeduplicator::claim($dedupeKey)) {
                $items[] = self::item($phone, SendStatus::Sent, 'duplicate', $row['ref_id'] ?? null, true);

                continue;
            }

            $row['ref_id'] = (string) ($row['ref_id'] ?? Str::uuid());

            if ($kind === 'text') {
                $row['message'] = SenderIdentity::decorate((string) $row['message'], $senderNumber);
            }

            $outgoing[] = ['row' => $row, 'key' => $dedupeKey, 'index' => count($items)];
            $items[] = null;
        }

        $reason = null;

        if ($outgoing !== []) {
            [$overall, $reason, $perRef] = self::post($gateway, $url, $headers, array_column($outgoing, 'row'));

            foreach ($outgoing as $entry) {
                $refId = $entry['row']['ref_id'];
                [$status, $itemReason, $duplicate] = $perRef[$refId] ?? [$overall, $reason, false];

                if ($status === SendStatus::Failed) {
                    MessageDeduplicator::release($entry['key']);
                } else {
                    // Sent atau Uncertain: anggap sudah terkirim supaya retry/failover tidak mengirim ulang.
                    MessageDeduplicator::keep($entry['key']);
                }

                $items[$entry['index']] = self::item($entry['row']['phone'], $status, $itemReason, $refId, $duplicate);
            }
        }

        $result = SendResult::fromItems($gateway, $items, $reason);
        self::log($result, $url);

        return $result;
    }

    /**
     * @return array{0: SendStatus, 1: ?string, 2: array<string, array{0: SendStatus, 1: ?string, 2: bool}>}
     */
    private static function post(string $gateway, string $url, array $headers, array $rows): array
    {
        try {
            $response = Http::withHeaders($headers)
                ->withoutVerifying()
                ->acceptJson()
                ->connectTimeout(10)
                ->timeout(30)
                ->post($url, ['data' => $rows]);
        } catch (ConnectionException $e) {
            $definite = (bool) preg_match(self::CONNECT_FAILURE_PATTERN, $e->getMessage());
            Log::warning("WhatsApp {$gateway} connection error", ['url' => $url, 'error' => $e->getMessage(), 'definite_failure' => $definite]);

            return [$definite ? SendStatus::Failed : SendStatus::Uncertain, $definite ? 'connection_failed' : 'timeout', []];
        } catch (Throwable $e) {
            Log::error("WhatsApp {$gateway} unexpected error", ['url' => $url, 'error' => $e->getMessage()]);

            return [SendStatus::Uncertain, 'exception', []];
        }

        $json = $response->json();
        $perRef = self::perItemResults($json);

        if (! $response->successful()) {
            Log::warning("WhatsApp {$gateway} HTTP {$response->status()}", ['url' => $url, 'response' => Str::limit($response->body(), 1000)]);

            $status = $response->serverError() && ! in_array($response->status(), self::UNPROCESSED_SERVER_ERRORS, true)
                ? SendStatus::Uncertain
                : SendStatus::Failed;

            return [$status, 'http_'.$response->status(), $perRef];
        }

        if (! is_array($json) || ! array_key_exists('status', $json)) {
            return [SendStatus::Uncertain, 'unreadable_response', []];
        }

        if ($json['status'] !== true) {
            Log::warning("WhatsApp {$gateway} rejected", ['url' => $url, 'response' => $json]);

            return [SendStatus::Failed, 'rejected', $perRef];
        }

        // Messara versi lama selalu status true; pastikan memang ada yang terkirim.
        if ($perRef === [] && isset($json['data']['success']) && (int) $json['data']['success'] === 0) {
            return [SendStatus::Failed, 'nothing_sent', []];
        }

        return [SendStatus::Sent, null, $perRef];
    }

    /**
     * Hasil per pesan dari Messara (`data.results[]`), dipetakan berdasarkan ref_id.
     *
     * @return array<string, array{0: SendStatus, 1: ?string, 2: bool}>
     */
    private static function perItemResults(mixed $json): array
    {
        $results = is_array($json) ? ($json['data']['results'] ?? null) : null;
        if (! is_array($results)) {
            return [];
        }

        $map = [];
        foreach ($results as $result) {
            if (! is_array($result) || empty($result['ref_id'])) {
                continue;
            }

            $map[(string) $result['ref_id']] = match ($result['status'] ?? null) {
                'sent' => [SendStatus::Sent, null, false],
                'duplicate' => [SendStatus::Sent, 'duplicate', true],
                'failed' => [SendStatus::Failed, $result['reason'] ?? 'failed', false],
                default => [SendStatus::Uncertain, 'unknown_item_status', false],
            };
        }

        return $map;
    }

    private static function hasContent(string $kind, array $row): bool
    {
        return $kind === 'template'
            ? filled($row['template_name'] ?? $row['template'] ?? null)
            : filled($row['message'] ?? null);
    }

    /**
     * Sidik jari isi pesan (tanpa nomor, ref_id, nama) untuk kunci anti-duplikat.
     */
    private static function fingerprint(string $kind, array $row): string
    {
        if ($kind === 'text') {
            return 'text|'.$row['message'];
        }

        $content = $row;
        unset($content['phone'], $content['ref_id'], $content['name'], $content['isGroup']);
        ksort($content);

        return 'template|'.json_encode($content);
    }

    /**
     * @return array{phone: string, status: SendStatus, reason: ?string, ref_id: ?string, duplicate: bool}
     */
    private static function item(string $phone, SendStatus $status, ?string $reason, ?string $refId, bool $duplicate = false): array
    {
        return ['phone' => $phone, 'status' => $status, 'reason' => $reason, 'ref_id' => $refId, 'duplicate' => $duplicate];
    }

    private static function log(SendResult $result, string $url): void
    {
        $context = [
            'url' => $url,
            'status' => $result->status->value,
            'items' => array_map(fn (array $item) => [
                'phone' => $item['phone'],
                'status' => $item['status']->value,
                'reason' => $item['reason'],
                'ref_id' => $item['ref_id'],
            ], $result->items),
        ];

        match ($result->status) {
            SendStatus::Sent => Log::info("WhatsApp {$result->gateway} sent", $context),
            SendStatus::Uncertain => Log::warning("WhatsApp {$result->gateway} uncertain: dianggap terkirim, tidak di-retry agar tidak dobel", $context),
            SendStatus::Failed => Log::error("WhatsApp {$result->gateway} failed", $context),
        };
    }
}
