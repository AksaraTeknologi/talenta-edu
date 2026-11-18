<?php

namespace App\Console\Commands;

use App\Models\CertificationProgram;
use App\Services\Brevetlearning\BrevetlearningClient;
use App\Services\Brevetlearning\BrevetlearningException;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Putus hubungan batch → kelas brevetlearning yang sudah dihapus (brevetlearning menjawab "kode tidak ditemukan").
 * Pengaman: galat jaringan/token membatalkan semuanya; bila SEMUA kode (≥2) tidak ditemukan sekaligus, kemungkinan
 * token/pengajar berubah, jadi tidak ada yang diputus.
 */
class PruneBrevetlearningLinks extends Command
{
    protected $signature = 'brevetlearning:prune-links {--dry-run : Tampilkan saja, jangan ubah data}';

    protected $description = 'Putus hubungan batch ke kelas brevetlearning yang sudah dihapus';

    public function handle(BrevetlearningClient $client): int
    {
        if (!$client->configured()) {
            $this->info('Integrasi brevetlearning belum diatur; dilewati.');

            return self::SUCCESS;
        }

        $programs = CertificationProgram::whereNotNull('brevetlearning_course_code')
            ->where('brevetlearning_course_code', '!=', '')
            ->get();

        $hilang = collect();
        try {
            foreach ($programs as $program) {
                if ($client->lookup($program->brevetlearning_course_code) === null) {
                    $hilang->push($program);
                }
            }
        } catch (BrevetlearningException $e) {
            Log::warning('brevetlearning:prune-links dibatalkan', ['message' => $e->getMessage()]);
            $this->error('Dibatalkan, tidak ada yang diubah: '.$e->getMessage());

            return self::FAILURE;
        }

        if ($hilang->count() > 1 && $hilang->count() === $programs->count()) {
            Log::warning('brevetlearning:prune-links: semua kode tidak ditemukan, tidak ada yang diputus', ['jumlah' => $hilang->count()]);
            $this->warn("Semua {$hilang->count()} kode tidak ditemukan — kemungkinan token atau pengajar berubah. Tidak ada yang diputus.");

            return self::FAILURE;
        }

        foreach ($hilang as $program) {
            $this->line("Diputus: {$program->title} batch {$program->batch} (kode {$program->brevetlearning_course_code})");
            if (!$this->option('dry-run')) {
                Log::info('brevetlearning: hubungan batch diputus, kelas sudah dihapus', ['program_id' => $program->id, 'code' => $program->brevetlearning_course_code]);
                $program->update(['brevetlearning_course_code' => null, 'brevetlearning_platform' => null]);
            }
        }

        $this->info(($this->option('dry-run') ? '[dry-run] ' : '')."{$programs->count()} batch dicek, {$hilang->count()} diputus.");

        return self::SUCCESS;
    }
}
