<?php

namespace App\Services\Brevetlearning;

use RuntimeException;

/** Gagal memanggil brevetlearning. Pesan aman ditampilkan (tanpa token). */
class BrevetlearningException extends RuntimeException
{
}
