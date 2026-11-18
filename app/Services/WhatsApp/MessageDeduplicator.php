<?php

namespace App\Services\WhatsApp;

use Illuminate\Support\Facades\Cache;

/**
 * Penjaga anti pesan ganda lintas gateway.
 *
 * Kunci dihitung dari nomor tujuan + isi pesan asli (sebelum ditambah catatan nomor pengirim),
 * sehingga pesan yang sama tidak terkirim dua kali meski dipicu berulang (callback + rekonsiliasi,
 * retry job) atau nanti dilempar ke gateway lain saat failover.
 *
 * Alur: claim() sebelum kirim -> keep() bila Sent/Uncertain -> release() bila Failed.
 */
final class MessageDeduplicator
{
    public static function key(string $phone, string $fingerprint): string
    {
        return 'wa:dedupe:'.sha1(PhoneNumber::normalize($phone).'|'.$fingerprint);
    }

    /**
     * Return false bila pesan yang sama sudah terkirim / sedang dikirim dalam rentang TTL.
     */
    public static function claim(string $key): bool
    {
        $ttl = self::ttl();

        return $ttl <= 0 || Cache::add($key, 'processing', $ttl);
    }

    public static function keep(string $key): void
    {
        $ttl = self::ttl();

        if ($ttl > 0) {
            Cache::put($key, 'sent', $ttl);
        }
    }

    public static function release(string $key): void
    {
        if (self::ttl() > 0) {
            Cache::forget($key);
        }
    }

    private static function ttl(): int
    {
        return (int) config('services.whatsapp.dedupe_ttl', 600);
    }
}
