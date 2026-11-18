<?php

namespace App\Services\Brevetlearning;

use App\Models\CertificationProgram;
use App\Models\Invoice;
use Illuminate\Support\Collection;

/**
 * Peserta batch yang berhak masuk kelas brevetlearning: lunas, atau cicilan
 * dengan minimal satu termin terbayar (sama dengan "Peserta Aktif" di tab Pendaftar).
 */
class ProgramParticipants
{
    /** @return Collection<int, array{user_id: string, name: string, email: string, phone_number: ?string, invoice_code: ?string, payment: string}> */
    public function eligible(CertificationProgram $program): Collection
    {
        return Invoice::with(['user', 'installmentTerms'])
            ->whereNull('parent_invoice_id')
            ->whereHas('certificationProgramItems', fn ($q) => $q->where('certification_program_id', $program->id))
            ->where(function ($q) {
                $q->whereIn('status', ['paid', 'completed'])
                    ->orWhere(function ($sq) {
                        $sq->where(fn ($inner) => $inner->where('is_installment', true)->orWhere('status', 'installment_pending'))
                            ->whereHas('installmentTerms', fn ($tq) => $tq->where('status', 'paid'));
                    });
            })
            ->latest()
            ->get()
            ->filter(fn ($invoice) => $invoice->user && filled($invoice->user->email))
            ->unique(fn ($invoice) => strtolower(trim($invoice->user->email)))
            ->map(fn ($invoice) => [
                'user_id' => $invoice->user->id,
                'name' => $invoice->user->name,
                'email' => trim($invoice->user->email),
                'phone_number' => $invoice->user->phone_number,
                'invoice_code' => $invoice->invoice_code,
                'payment' => in_array($invoice->status, ['paid', 'completed'], true) ? 'paid' : 'installment',
            ])
            ->values();
    }

    public static function normalizePhone(?string $phone): string
    {
        $digits = preg_replace('/\D+/', '', (string) $phone);
        if (str_starts_with($digits, '62')) {
            $digits = '0' . substr($digits, 2);
        }

        return $digits;
    }
}
