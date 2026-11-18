<?php

namespace App\Services\WhatsApp;

/**
 * Hasil satu panggilan kirim WhatsApp (bisa berisi banyak penerima).
 */
final class SendResult
{
    /**
     * @param  array<int, array{phone: string, status: SendStatus, reason: ?string, ref_id: ?string, duplicate: bool}>  $items
     */
    public function __construct(
        public readonly string $gateway,
        public readonly SendStatus $status,
        public readonly array $items = [],
        public readonly ?string $reason = null,
    ) {}

    /**
     * Semua penerima berstatus Sent, Uncertain jika ada yang tak pasti, selain itu Failed.
     *
     * @param  array<int, array{phone: string, status: SendStatus, reason: ?string, ref_id: ?string, duplicate: bool}>  $items
     */
    public static function fromItems(string $gateway, array $items, ?string $reason = null): self
    {
        $statuses = array_map(fn (array $item) => $item['status'], $items);

        $status = match (true) {
            $statuses === [] => SendStatus::Failed,
            in_array(SendStatus::Uncertain, $statuses, true) => SendStatus::Uncertain,
            in_array(SendStatus::Failed, $statuses, true) => SendStatus::Failed,
            default => SendStatus::Sent,
        };

        return new self($gateway, $status, $items, $reason);
    }

    public function isSent(): bool
    {
        return $this->status === SendStatus::Sent;
    }

    /**
     * Penerima yang pasti gagal sehingga aman dikirim ulang lewat gateway lain.
     *
     * @return array<int, array{phone: string, status: SendStatus, reason: ?string, ref_id: ?string, duplicate: bool}>
     */
    public function failedItems(): array
    {
        return array_values(array_filter($this->items, fn (array $item) => $item['status'] === SendStatus::Failed));
    }
}
