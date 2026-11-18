<?php

namespace App\Services\WhatsApp;

final class PhoneNumber
{
    /**
     * Normalisasi ke format 62xxxxxxxx (hanya angka).
     */
    public static function normalize(?string $phone): string
    {
        $digits = preg_replace('/[^0-9]/', '', (string) $phone);

        if ($digits === '') {
            return '';
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        return str_starts_with($digits, '62') ? $digits : '62'.$digits;
    }
}
