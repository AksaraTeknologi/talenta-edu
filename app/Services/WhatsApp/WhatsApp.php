<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Log;

/**
 * Titik kirim WhatsApp untuk seluruh aplikasi.
 *
 * Gateway dipilih lewat env DEFAULT_WA_GATEWAY (config services.whatsapp.gateway):
 *   - messara (default): teks + template WhatsApp Official
 *   - wablas           : teks saja; template otomatis dianggap gagal sehingga pemanggil fallback ke teks
 *
 * Pindah gateway cukup ganti env lalu `php artisan config:clear` (atau config:cache ulang).
 */
final class WhatsApp
{
    public const GATEWAYS = [MessaraGateway::NAME, WablasGateway::NAME];

    public static function gateway(): string
    {
        $gateway = strtolower(trim((string) config('services.whatsapp.gateway', MessaraGateway::NAME)));

        if (! in_array($gateway, self::GATEWAYS, true)) {
            Log::warning("DEFAULT_WA_GATEWAY '{$gateway}' tidak dikenal, memakai messara");

            return MessaraGateway::NAME;
        }

        return $gateway;
    }

    public static function sendText(array $data = []): bool
    {
        return self::sendTextResult($data)->isSent();
    }

    public static function sendLink(array $data = []): bool
    {
        return self::sendText($data);
    }

    public static function sendTemplate(array $data = []): bool
    {
        return self::sendTemplateResult($data)->isSent();
    }

    public static function sendTextResult(array $data = []): SendResult
    {
        return self::gateway() === WablasGateway::NAME
            ? WablasGateway::sendTextResult($data)
            : MessaraGateway::sendTextResult($data);
    }

    public static function sendTemplateResult(array $data = []): SendResult
    {
        if (self::gateway() === WablasGateway::NAME) {
            return new SendResult(WablasGateway::NAME, SendStatus::Failed, [], 'template_unsupported');
        }

        return MessaraGateway::sendTemplateResult($data);
    }
}
