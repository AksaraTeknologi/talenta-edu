<?php

namespace App\Services\WhatsApp;

/**
 * Menandai pesan teks yang keluar dari nomor selain nomor utama, supaya penerima tahu
 * pesan itu tetap resmi dan tahu nomor utama yang harus disimpan/dihubungi.
 *
 * Aktif hanya bila WA_PRIMARY_SENDER_NUMBER dan nomor pengirim gateway sama-sama diisi dan berbeda.
 */
final class SenderIdentity
{
    public static function decorate(string $message, ?string $gatewaySenderNumber): string
    {
        $primary = PhoneNumber::normalize(config('services.whatsapp.primary_sender_number'));
        $sender = PhoneNumber::normalize($gatewaySenderNumber);
        $notice = (string) config('services.whatsapp.backup_sender_notice', '');

        if ($primary === '' || $sender === '' || $primary === $sender || trim($notice) === '') {
            return $message;
        }

        return rtrim($message)."\n\n".strtr($notice, [
            ':primary' => $primary,
            ':app' => (string) config('app.name'),
        ]);
    }
}
