<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Log;

/**
 * Gateway Messara (messara.aksarateknologi.co.id). Mendukung teks dan template WhatsApp Official.
 * Konfigurasi: config('services.whatsapp.messara.*').
 */
final class MessaraGateway
{
    public const NAME = 'messara';

    public static function sendTextResult(array $data): SendResult
    {
        return self::deliver('/api/v2/send-message', $data, 'text');
    }

    public static function sendTemplateResult(array $data): SendResult
    {
        return self::deliver('/api/v2/send-template', $data, 'template');
    }

    /**
     * @param  'text'|'template'  $kind
     */
    private static function deliver(string $endpoint, array $data, string $kind): SendResult
    {
        $config = (array) config('services.whatsapp.messara', []);
        $token = $config['api_key'] ?? null;
        $secretKey = $config['secret_key'] ?? null;
        $domain = (string) ($config['domain'] ?? '');

        if (empty($token) || $domain === '') {
            Log::error('Messara API Key atau domain belum dikonfigurasi (MESSARA_API_KEY / MESSARA_DOMAIN_SERVER)');

            return new SendResult(self::NAME, SendStatus::Failed, [], 'missing_credentials');
        }

        // Cegah deadlock di lingkungan local hanya jika memanggil port yang sama (self-call pada single-threaded server)
        $currentPort = app()->runningInConsole() ? null : request()->getPort();
        $targetPort = parse_url($domain, PHP_URL_PORT) ?: 80;
        if (app()->environment('local') && (str_contains($domain, 'localhost') || str_contains($domain, '127.0.0.1')) && $currentPort === $targetPort) {
            Log::info('Messara skipped in local environment to prevent deadlock with self', ['data' => $data]);

            return new SendResult(self::NAME, SendStatus::Sent, [], 'skipped_local');
        }

        $headers = ['X-Api-Key' => $token];
        if (! empty($secretKey)) {
            $headers['Authorization'] = "{$token}.{$secretKey}";
            $headers['X-Secret-Key'] = $secretKey;
        } else {
            $headers['Authorization'] = $token;
        }

        $url = rtrim($domain, '/').'/'.ltrim($endpoint, '/');

        return GatewayClient::deliver(self::NAME, $url, $headers, $data, $kind, $config['sender_number'] ?? null);
    }
}
