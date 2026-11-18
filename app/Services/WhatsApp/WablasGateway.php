<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Log;

/**
 * Gateway Wablas. Hanya teks (tidak mendukung template WhatsApp Official).
 * Konfigurasi: config('services.whatsapp.wablas.*'), bukan env() langsung,
 * supaya tetap terbaca setelah `php artisan config:cache`.
 */
final class WablasGateway
{
    public const NAME = 'wablas';

    public static function sendTextResult(array $data): SendResult
    {
        $config = (array) config('services.whatsapp.wablas', []);
        $token = $config['token'] ?? null;
        $secretKey = $config['secret'] ?? null;
        $domain = (string) ($config['domain'] ?? '');

        if (empty($token) || empty($secretKey) || $domain === '') {
            Log::error('Wablas token, secret key, atau domain belum dikonfigurasi (SECURITY_TOKEN_WABLAS / SECRET_KEY_WABLAS)');

            return new SendResult(self::NAME, SendStatus::Failed, [], 'missing_credentials');
        }

        return GatewayClient::deliver(
            self::NAME,
            rtrim($domain, '/').'/api/v2/send-message',
            ['Authorization' => "{$token}.{$secretKey}"],
            $data,
            'text',
            $config['sender_number'] ?? null,
        );
    }
}
