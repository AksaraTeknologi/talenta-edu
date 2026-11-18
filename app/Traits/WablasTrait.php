<?php

namespace App\Traits;

use App\Services\WhatsApp\WablasGateway;

/**
 * Kirim langsung lewat Wablas, mengabaikan DEFAULT_WA_GATEWAY.
 * Untuk notifikasi biasa gunakan WhatsAppTrait.
 */
trait WablasTrait
{
    public static function sendText($data = [])
    {
        return WablasGateway::sendTextResult((array) $data)->isSent();
    }

    public static function sendLink($data = [])
    {
        return self::sendText($data);
    }
}
