<?php

namespace App\Services\Brevetlearning;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

/**
 * Klien API integrasi brevetlearning.id (`/api/v1/integration`).
 * Token dibaca dari config, tidak pernah dikirim ke browser.
 */
class BrevetlearningClient
{
    public function configured(): bool
    {
        return filled(config('services.brevetlearning.url')) && filled(config('services.brevetlearning.token'));
    }

    public function defaultPlatform(): ?string
    {
        return config('services.brevetlearning.default_platform') ?: null;
    }

    /** @return array<int, array{code: string, name: string}> */
    public function platforms(): array
    {
        return Cache::remember('brevetlearning.platforms', 600, fn () => $this->get('/platforms')['data'] ?? []);
    }

    /**
     * Kelas berdasarkan kode; null HANYA bila brevetlearning sendiri menjawab "kode tidak ditemukan"
     * (404 + {"success": false}). 404 lain (alamat API salah, halaman nginx) dilempar sebagai galat agar
     * pemutusan otomatis tidak terjadi karena salah konfigurasi.
     */
    public function lookup(string $code): ?array
    {
        $response = $this->send(fn (PendingRequest $http) => $http->get('/courses/lookup', ['code' => $code]));
        if ($response->status() === 404) {
            if ($response->json('success') === false) {
                return null;
            }
            throw new BrevetlearningException('Alamat API brevetlearning tidak dikenali (404). Cek BREVETLEARNING_API_URL.');
        }

        return $this->json($response)['data'] ?? null;
    }

    public function enroll(string $courseCode, ?string $platformCode, array $participants): array
    {
        $response = $this->send(fn (PendingRequest $http) => $http->post('/enroll', [
            'course_code' => $courseCode,
            'platform_code' => $platformCode,
            'participants' => $participants,
        ]));

        return $this->json($response);
    }

    private function get(string $path): array
    {
        return $this->json($this->send(fn (PendingRequest $http) => $http->get($path)));
    }

    private function send(callable $call): Response
    {
        if (!$this->configured()) {
            throw new BrevetlearningException('Integrasi brevetlearning belum diatur (BREVETLEARNING_API_URL / BREVETLEARNING_ENROLL_TOKEN).');
        }

        $http = Http::baseUrl(rtrim(config('services.brevetlearning.url'), '/') . '/api/v1/integration')
            ->withToken(config('services.brevetlearning.token'))
            ->acceptJson()
            ->timeout(config('services.brevetlearning.timeout', 20));

        try {
            return $call($http);
        } catch (ConnectionException $e) {
            throw new BrevetlearningException('brevetlearning tidak bisa dihubungi. Coba lagi beberapa saat.');
        }
    }

    private function json(Response $response): array
    {
        if ($response->status() === 401 || $response->status() === 403) {
            throw new BrevetlearningException('Token brevetlearning ditolak. Minta token baru (php artisan integration:token di brevetlearning).');
        }
        if ($response->failed()) {
            $message = $response->json('message') ?: 'HTTP ' . $response->status();
            throw new BrevetlearningException('brevetlearning menolak permintaan: ' . $message);
        }

        return $response->json() ?? [];
    }
}
