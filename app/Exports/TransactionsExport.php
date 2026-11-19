<?php

namespace App\Exports;

use App\Models\Invoice;
use Maatwebsite\Excel\Concerns\FromQuery;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;

class TransactionsExport implements
    FromQuery,
    \Maatwebsite\Excel\Concerns\WithHeadings,
    \Maatwebsite\Excel\Concerns\WithMapping,
    \Maatwebsite\Excel\Concerns\WithColumnWidths,
    \Maatwebsite\Excel\Concerns\WithStyles
{
    protected $startDate;
    protected $endDate;
    protected $status;
    protected $paymentType;
    protected $productType;
    protected $bootcampId;
    protected $webinarId;
    protected $courseId;
    protected $bundleId;
    protected $certificationProgramId;
    protected $title;
    protected $userName;
    protected $search;
    protected $isStaff;

    public function __construct($filters = [], ?bool $isStaff = null)
    {
        $this->startDate = $filters['start_date'] ?? null;
        $this->endDate = $filters['end_date'] ?? null;
        $this->status = $filters['status'] ?? null;
        $this->paymentType = $filters['payment_type'] ?? null;
        $this->productType = $filters['product_type'] ?? null;
        $this->bootcampId = $filters['bootcamp_id'] ?? null;
        $this->webinarId = $filters['webinar_id'] ?? null;
        $this->courseId = $filters['course_id'] ?? null;
        $this->bundleId = $filters['bundle_id'] ?? null;
        $this->certificationProgramId = $filters['certification_program_id'] ?? null;
        $this->title = $filters['title'] ?? null;
        $this->userName = $filters['user_name'] ?? null;
        $this->search = $filters['search'] ?? null;
        $this->isStaff = $isStaff ?? (auth()->check() && auth()->user()->hasRole('staff') && !auth()->user()->hasRole('admin'));
    }

    public function query()
    {
        $query = Invoice::with([
            'user',
            'referrer',
            'courseItems.course',
            'parentInvoice.user',
            'parentInvoice.courseItems.course',
            'parentInvoice.bootcampItems.bootcamp',
            'parentInvoice.webinarItems.webinar',
            'parentInvoice.bundleEnrollments.bundle',
            'parentInvoice.certificationProgramItems.certificationProgram',
            'bootcampItems.bootcamp',
            'webinarItems.webinar',
            'bundleEnrollments.bundle',
            'certificationProgramItems.certificationProgram'
        ]);

        $query->where(function ($q) {
            $q->where(function ($sq) {
                $sq->whereNull('parent_invoice_id')->where('is_installment', false);
            })->orWhereNotNull('parent_invoice_id');
        });

        // Apply date filter
        if ($this->startDate && $this->endDate) {
            $start = Carbon::parse($this->startDate)->startOfDay();
            $end = Carbon::parse($this->endDate)->endOfDay();
            $query->where(function ($q) use ($start, $end) {
                $q->where(function ($q2) use ($start, $end) {
                    $q2->where('status', 'paid')
                        ->whereBetween('paid_at', [$start, $end]);
                })->orWhere(function ($q2) use ($start, $end) {
                    $q2->where('status', '!=', 'paid')
                        ->whereBetween('created_at', [$start, $end]);
                });
            });
        }

        // Apply status filter
        $statuses = $this->toArray($this->status);
        if (!empty($statuses)) {
            $query->whereIn('status', $statuses);
        }

        // Apply payment type filter
        $paymentTypes = $this->toArray($this->paymentType);
        $hasFree = in_array('free', $paymentTypes);
        $hasPaid = in_array('paid', $paymentTypes);
        if ($hasFree && !$hasPaid) {
            $query->where('nett_amount', 0);
        } elseif ($hasPaid && !$hasFree) {
            $query->where('nett_amount', '>', 0);
        }

        // Apply product type filter
        $productTypes = $this->toArray($this->productType);
        $specificIdMap = [
            'course' => $this->courseId,
            'bootcamp' => $this->bootcampId,
            'webinar' => $this->webinarId,
            'bundle' => $this->bundleId,
            'certification_program' => $this->certificationProgramId,
        ];
        $isSingleTypeWithId = count($productTypes) === 1 && !empty($specificIdMap[$productTypes[0]] ?? null);

        if (!empty($productTypes) && !$isSingleTypeWithId) {
            // Sama dengan logika filter di halaman transaksi (mendukung multi pilihan & invoice cicilan)
            $relationMap = [
                'course' => 'courseItems',
                'bootcamp' => 'bootcampItems',
                'webinar' => 'webinarItems',
                'bundle' => 'bundleEnrollments',
                'certification_program' => 'certificationProgramItems',
                'certification' => 'certificationProgramItems',
            ];
            $query->where(function ($q) use ($productTypes, $relationMap) {
                foreach ($productTypes as $pType) {
                    $relation = $relationMap[$pType] ?? null;
                    if (!$relation) {
                        continue;
                    }
                    $q->orWhere(function ($sq) use ($relation) {
                        $sq->whereHas($relation)->orWhereHas('parentInvoice.' . $relation);
                    });
                }
            });
        } elseif ($isSingleTypeWithId) {
            // Filter produk spesifik (dipakai dari halaman detail kelas/bootcamp/webinar/bundle/sertifikasi).
            // Invoice termin cicilan tidak punya item produk sendiri (itemnya ada di parent invoice),
            // jadi cek juga relasi lewat parentInvoice agar transaksi cicilan ikut terekspor.
            $specificMap = [
                'course' => ['courseItems', 'course_id'],
                'bootcamp' => ['bootcampItems', 'bootcamp_id'],
                'webinar' => ['webinarItems', 'webinar_id'],
                'bundle' => ['bundleEnrollments', 'bundle_id'],
                'certification_program' => ['certificationProgramItems', 'certification_program_id'],
            ];
            $type = $productTypes[0];
            [$relation, $column] = $specificMap[$type];
            $productId = $specificIdMap[$type];

            $query->where(function ($q) use ($relation, $column, $productId) {
                $q->whereHas($relation, fn ($r) => $r->where($column, $productId))
                    ->orWhereHas('parentInvoice.' . $relation, fn ($r) => $r->where($column, $productId));
            });

            if ($type !== 'bundle') {
                $query->doesntHave('bundleEnrollments')
                    ->where(function ($q) {
                        $q->whereNull('parent_invoice_id')
                            ->orWhereDoesntHave('parentInvoice.bundleEnrollments');
                    });
            }
        }

        // Apply search filter (kode invoice, nama, email, no. HP)
        if ($this->search) {
            $search = $this->search;
            $query->where(function ($q) use ($search) {
                $q->where('invoice_code', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($uq) use ($search) {
                        $uq->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phone_number', 'like', "%{$search}%");
                    });
            });
        }

        // Apply user name filter
        if ($this->userName) {
            $query->whereHas('user', function ($q) {
                $q->where('name', 'like', '%' . $this->userName . '%');
            });
        }

        // Apply title filter
        if ($this->title) {
            $title = $this->title;
            $titleProductTypes = $this->toArray($this->productType);
            if (count($titleProductTypes) === 1) {
                switch ($titleProductTypes[0]) {
                    case 'course':
                        $query->whereHas('courseItems.course', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'bootcamp':
                        $query->whereHas('bootcampItems.bootcamp', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'webinar':
                        $query->whereHas('webinarItems.webinar', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'bundle':
                        $query->whereHas('bundleEnrollments.bundle', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                    case 'certification_program':
                        $query->whereHas('certificationProgramItems.certificationProgram', function ($q) use ($title) {
                            $q->where('title', 'like', '%' . $title . '%');
                        });
                        break;
                }
            } else {
                $query->where(function ($q) use ($title) {
                    $q->whereHas('courseItems.course', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('bootcampItems.bootcamp', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('webinarItems.webinar', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('bundleEnrollments.bundle', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    })
                    ->orWhereHas('certificationProgramItems.certificationProgram', function ($q2) use ($title) {
                        $q2->where('title', 'like', '%' . $title . '%');
                    });
                });
            }
        }

        return $query->orderByRaw('COALESCE(paid_at, created_at) DESC');
    }

    protected function includesProductType(string $type): bool
    {
        $productTypes = $this->toArray($this->productType);

        return empty($productTypes) || in_array($type, $productTypes, true);
    }

    /**
     * Ubah nilai filter (string dipisah koma atau array) menjadi array.
     */
    protected function toArray($value): array
    {
        if (empty($value)) {
            return [];
        }

        $values = is_array($value) ? $value : explode(',', (string) $value);

        return array_values(array_filter(array_map('trim', $values), fn ($v) => $v !== ''));
    }

    public function headings(): array
    {
        if ($this->isStaff) {
            return [
                'No',
                'Kode Invoice',
                'Nama Pembeli',
                'Email',
                'No. HP',
                'Instansi',
                'Kota Domisili',
                'Nama Produk',
                'Kode Batch',
                'Jenis Produk',
                'Status',
                'Jenis Pembayaran',
                'Metode Pembayaran',
                'Channel Pembayaran',
                'Afiliasi',
                'Tanggal Pembelian',
                'Tanggal Pembayaran',
            ];
        }

        return [
            'No',
            'Kode Invoice',
            'Nama Pembeli',
            'Email',
            'No. HP',
            'Instansi',
            'Kota Domisili',
            'Nama Produk',
            'Kode Batch',
            'Jenis Produk',
            'Harga Asli',
            'Diskon',
            'Biaya Admin',
            'Total Bayar',
            'Status',
            'Jenis Pembayaran',
            'Metode Pembayaran',
            'Channel Pembayaran',
            'Afiliasi',
            'Komisi Afiliasi',
            'Tanggal Pembelian',
            'Tanggal Pembayaran',
        ];
    }

    public function map($invoice): array
    {
        static $index = 0;
        $index++;

        $user = $invoice->user ?? $invoice->parentInvoice?->user;
        $referrerName = $invoice->referrer?->name ?? $invoice->parentInvoice?->referrer?->name ?? $invoice->referredByUser?->name ?? $invoice->parentInvoice?->referredByUser?->name ?? '-';

        $statusLabel = ucfirst($invoice->status);
        if ($invoice->installment_number) {
            $statusLabel = 'Cicilan ke-' . $invoice->installment_number . ' (' . ($invoice->status === 'paid' ? 'Lunas' : ucfirst($invoice->status)) . ')';
        }

        if ($this->isStaff) {
            return [
                $index,
                $invoice->invoice_code,
                $user->name ?? '-',
                $user->email ?? '-',
                $user->phone_number ?? '-',
                $user->instance ?? '-',
                $user->city ?? '-',
                $this->getProductNames($invoice),
                $this->getProductBatch($invoice),
                $this->getProductType($invoice),
                $statusLabel,
                $invoice->nett_amount === 0 ? 'Gratis' : 'Berbayar',
                $invoice->payment_method ?? '-',
                $invoice->payment_channel ?? '-',
                $referrerName,
                $invoice->created_at ? $invoice->created_at->format('d M Y, H:i') : '-',
                $invoice->paid_at ? Carbon::parse($invoice->paid_at)->format('d M Y, H:i') : '-',
            ];
        }

        return [
            $index,
            $invoice->invoice_code,
            $user->name ?? '-',
            $user->email ?? '-',
            $user->phone_number ?? '-',
            $user->instance ?? '-',
            $user->city ?? '-',
            $this->getProductNames($invoice),
            $this->getProductBatch($invoice),
            $this->getProductType($invoice),
            'Rp ' . number_format($invoice->amount, 0, ',', '.'),
            'Rp ' . number_format($invoice->discount_amount ?? 0, 0, ',', '.'),
            'Rp ' . number_format($invoice->transaction_fee ?? 0, 0, ',', '.'),
            'Rp ' . number_format($invoice->nett_amount, 0, ',', '.'),
            $statusLabel,
            $invoice->nett_amount === 0 ? 'Gratis' : 'Berbayar',
            $invoice->payment_method ?? '-',
            $invoice->payment_channel ?? '-',
            $referrerName,
            $this->getAffiliateCommission($invoice),
            $invoice->created_at ? $invoice->created_at->format('d M Y, H:i') : '-',
            $invoice->paid_at ? Carbon::parse($invoice->paid_at)->format('d M Y, H:i') : '-',
        ];
    }

    public function columnWidths(): array
    {
        if ($this->isStaff) {
            return [
                'A' => 5,  // No
                'B' => 15, // Kode Invoice
                'C' => 25, // Nama Pembeli
                'D' => 30, // Email
                'E' => 15, // No. HP
                'F' => 20, // Instansi
                'G' => 20, // Kota Domisili
                'H' => 40, // Nama Produk
                'I' => 15, // Kode Batch
                'J' => 15, // Jenis Produk
                'K' => 10, // Status
                'L' => 15, // Jenis Pembayaran
                'M' => 18, // Metode Pembayaran
                'N' => 18, // Channel Pembayaran
                'O' => 25, // Afiliasi
                'P' => 20, // Tanggal Pembelian
                'Q' => 20, // Tanggal Pembayaran
            ];
        }

        return [
            'A' => 5,  // No
            'B' => 15, // Kode Invoice
            'C' => 25, // Nama Pembeli
            'D' => 30, // Email
            'E' => 15, // No. HP
            'F' => 20, // Instansi
            'G' => 20, // Kota Domisili
            'H' => 40, // Nama Produk
            'I' => 15, // Kode Batch
            'J' => 15, // Jenis Produk
            'K' => 15, // Harga Asli
            'L' => 15, // Diskon
            'M' => 12, // Biaya Admin
            'N' => 15, // Total Bayar
            'O' => 10, // Status
            'P' => 15, // Jenis Pembayaran
            'Q' => 18, // Metode Pembayaran
            'R' => 18, // Channel Pembayaran
            'S' => 25, // Afiliasi
            'T' => 18, // Komisi Afiliasi
            'U' => 20, // Tanggal Pembelian
            'V' => 20, // Tanggal Pembayaran
        ];
    }

    public function styles(Worksheet $sheet)
    {
        return [
            // Style header row
            1 => [
                'font' => ['bold' => true],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => 'E0E0E0']
                ],
            ],
        ];
    }

    private function getProductNames($invoice): string
    {
        $target = $invoice->parentInvoice ?? $invoice;
        $names = [];

        if ($this->includesProductType('course')) {
            if ($target->courseItems) {
                foreach ($target->courseItems as $item) {
                    $names[] = $item->course->title ?? '-';
                }
            }
        }

        if ($this->includesProductType('bootcamp')) {
            if ($target->bootcampItems) {
                foreach ($target->bootcampItems as $item) {
                    $names[] = $item->bootcamp->title ?? '-';
                }
            }
        }

        if ($this->includesProductType('webinar')) {
            if ($target->webinarItems) {
                foreach ($target->webinarItems as $item) {
                    $names[] = $item->webinar->title ?? '-';
                }
            }
        }

        if ($this->includesProductType('bundle')) {
            if ($target->bundleEnrollments) {
                foreach ($target->bundleEnrollments as $item) {
                    $names[] = $item->bundle->title ?? '-';
                }
            }
        }

        if ($this->includesProductType('certification_program')) {
            if ($target->certificationProgramItems) {
                foreach ($target->certificationProgramItems as $item) {
                    $names[] = $item->certificationProgram->title ?? '-';
                }
            }
        }

        return implode(', ', $names) ?: '-';
    }

    private function getProductBatch($invoice): string
    {
        $target = $invoice->parentInvoice ?? $invoice;
        $batches = [];

        if ($this->includesProductType('bootcamp')) {
            if ($target->bootcampItems) {
                foreach ($target->bootcampItems as $item) {
                    if (!empty($item->bootcamp?->batch)) {
                        $batches[] = $item->bootcamp->batch;
                    }
                }
            }
        }

        if ($this->includesProductType('webinar')) {
            if ($target->webinarItems) {
                foreach ($target->webinarItems as $item) {
                    if (!empty($item->webinar?->batch)) {
                        $batches[] = $item->webinar->batch;
                    }
                }
            }
        }

        if ($this->includesProductType('certification_program')) {
            if ($target->certificationProgramItems) {
                foreach ($target->certificationProgramItems as $item) {
                    if (!empty($item->certificationProgram?->batch)) {
                        $batches[] = $item->certificationProgram->batch;
                    }
                }
            }
        }

        return !empty($batches) ? implode(', ', array_unique($batches)) : '-';
    }

    private function getAffiliateCommission($invoice): string
    {
        $target = $invoice->parentInvoice ?? $invoice;
        $referrer = $invoice->referrer ?? $invoice->parentInvoice?->referrer ?? $invoice->referredByUser ?? $invoice->parentInvoice?->referredByUser;

        if (!$referrer) {
            return '-';
        }

        if (class_exists(\App\Models\AffiliateEarning::class)) {
            $earning = \App\Models\AffiliateEarning::where('invoice_id', $target->id)->sum('amount');
            if ($earning > 0) {
                return 'Rp ' . number_format($earning, 0, ',', '.');
            }
        }

        if (!empty($referrer->commission) && (float) $referrer->commission > 0) {
            $calc = $invoice->nett_amount * ((float) $referrer->commission / 100);
            return 'Rp ' . number_format($calc, 0, ',', '.');
        }

        return 'Rp 0';
    }

    private function getProductType($invoice): string
    {
        $target = $invoice->parentInvoice ?? $invoice;
        $productTypes = $this->toArray($this->productType);
        if (count($productTypes) === 1) {
            switch ($productTypes[0]) {
                case 'bundle': return 'Bundle';
                case 'course': return 'Kelas Online';
                case 'bootcamp': return 'Bootcamp';
                case 'webinar': return 'Webinar';
                case 'certification_program': return 'Sertifikasi';
            }
        }

        if ($target->bundleEnrollments && $target->bundleEnrollments->count() > 0) return 'Bundle';
        if ($target->courseItems && $target->courseItems->count() > 0) return 'Kelas Online';
        if ($target->bootcampItems && $target->bootcampItems->count() > 0) return 'Bootcamp';
        if ($target->webinarItems && $target->webinarItems->count() > 0) return 'Webinar';
        if ($target->certificationProgramItems && $target->certificationProgramItems->count() > 0) return 'Sertifikasi';
        return '-';
    }
}
