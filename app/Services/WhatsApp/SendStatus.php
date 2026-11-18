<?php

namespace App\Services\WhatsApp;

/**
 * Status hasil kirim WhatsApp ke gateway.
 *
 * - Sent      : gateway mengonfirmasi pesan diterima (atau sudah pernah terkirim / duplikat).
 * - Failed    : pasti tidak terkirim (koneksi gagal, ditolak, kuota habis, status false). Aman di-retry / failover.
 * - Uncertain : tidak bisa dipastikan (timeout setelah request terkirim, 5xx ambigu, respons tak terbaca).
 *               Diperlakukan "mungkin sudah terkirim" sehingga TIDAK di-retry/failover untuk mencegah pesan ganda.
 */
enum SendStatus: string
{
    case Sent = 'sent';
    case Failed = 'failed';
    case Uncertain = 'uncertain';
}
