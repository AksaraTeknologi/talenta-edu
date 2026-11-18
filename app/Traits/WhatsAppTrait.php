<?php

namespace App\Traits;

use App\Services\WhatsApp\WhatsApp;

/**
 * Kirim WhatsApp lewat gateway aktif (DEFAULT_WA_GATEWAY: messara | wablas).
 */
trait WhatsAppTrait
{
    public static function sendText(array $data = []): bool
    {
        return WhatsApp::sendText($data);
    }

    public static function sendLink(array $data = []): bool
    {
        return WhatsApp::sendLink($data);
    }

    public static function sendTemplate(array $data = []): bool
    {
        return WhatsApp::sendTemplate($data);
    }
}
