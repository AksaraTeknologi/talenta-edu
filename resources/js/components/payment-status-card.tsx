import { Button } from '@/components/ui/button';
import { Clock, Copy, Download, ExternalLink, Hourglass, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface PaymentStatusInstruction {
    title: string;
    steps: string[];
}

export interface PaymentStatusInvoice {
    id: string;
    invoice_code: string;
    status: string;
    amount: number;
    payment_method?: string;
    invoice_url?: string | null;
    va_number?: string;
    qr_code_url?: string;
    bank_name?: string;
    created_at: string;
    expires_at: string;
}

interface PaymentStatusCardProps {
    pendingInvoice: PaymentStatusInvoice;
    expiryInfo: { time: string; status: 'expired' | 'urgent' | 'normal' };
    instructions?: PaymentStatusInstruction[] | null;
    cancellingInvoice: boolean;
    onCopy: (text: string) => void;
    onCancel: () => void;
    onCheckStatus?: () => void;
}

export function PaymentStatusCard({
    pendingInvoice,
    expiryInfo,
    instructions,
    cancellingInvoice,
    onCopy,
    onCancel,
    onCheckStatus,
}: PaymentStatusCardProps) {
    const { t } = useTranslation('user');
    const isExpired = expiryInfo.status === 'expired' && pendingInvoice.status === 'pending';

    return (
        <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
            {/* Status Header */}
            <div
                className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 ${
                    isExpired ? 'border-[#FECACA] bg-[#FEF2F2]' : 'border-[#FDE68A] bg-[#FEFCE8]'
                }`}
            >
                <div className="flex items-center gap-2.5">
                    {isExpired ? (
                        <X className="h-5 w-5 shrink-0 text-[#B91C1C]" />
                    ) : (
                        <Hourglass className="h-5 w-5 shrink-0 text-[#A16207]" />
                    )}
                    <h2 className={`text-base font-semibold sm:text-lg ${isExpired ? 'text-[#B91C1C]' : 'text-[#854D0E]'}`}>
                        {isExpired
                            ? t('webinar.register.paymentExpiredTitle', 'Pembayaran Kedaluwarsa')
                            : t('webinar.register.pendingInvoiceTitle', 'Transaksi Menunggu Pembayaran')}
                    </h2>
                </div>

                {!isExpired && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#FDE68A] bg-white px-3 py-1 text-xs font-semibold text-[#A16207]">
                        <Clock className="h-3.5 w-3.5" />
                        {expiryInfo.time}
                    </span>
                )}
            </div>

            <div className="space-y-5 p-5 sm:p-6">
                {/* Invoice Summary */}
                <div className="space-y-3 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                    <div className="flex items-center justify-between gap-4 text-sm">
                        <span className="text-[#475569]">{t('webinar.register.invoiceCodeLabel', 'Kode Invoice')}</span>
                        <span className="font-semibold text-[#162230] tabular-nums">{pendingInvoice.invoice_code}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-[#DCE3EC] pt-3">
                        <span className="text-sm font-medium text-[#475569]">{t('webinar.register.totalPayment', 'Total Pembayaran')}</span>
                        <span className="text-xl font-bold text-[#12344E] tabular-nums">
                            Rp {pendingInvoice.amount.toLocaleString('id-ID')}
                        </span>
                    </div>
                </div>

                {isExpired ? (
                    <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4">
                        <p className="text-sm leading-relaxed text-[#B91C1C]">
                            {t(
                                'webinar.register.paymentExpiredNotice',
                                'Waktu pembayaran telah habis. Silakan batalkan transaksi untuk membuat pesanan baru.',
                            )}{' '}
                            <a
                                href="https://wa.me/+6285606391730"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[#1976D3] underline"
                            >
                                WhatsApp Admin
                            </a>
                            .
                        </p>
                    </div>
                ) : (
                    <>
                        {/* VA Number */}
                        {pendingInvoice.va_number && (
                            <div className="space-y-2.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">
                                    {t('webinar.register.vaNumberLabel', 'Nomor Virtual Account')}
                                </p>
                                <div className="flex items-center justify-between gap-3 rounded-lg border border-[#CBD5E1] bg-white px-3.5 py-2.5">
                                    <span className="font-mono text-base font-bold text-[#12344E] sm:text-lg">{pendingInvoice.va_number}</span>
                                    <Button type="button" size="sm" variant="outline" onClick={() => onCopy(pendingInvoice.va_number!)} className="h-9 gap-1.5">
                                        <Copy className="h-3.5 w-3.5" />
                                        {t('webinar.register.btnCopy', 'Salin')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* QR Code */}
                        {pendingInvoice.qr_code_url && (
                            <div className="space-y-3 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-[#475569]">
                                    {t('webinar.register.qrCodeLabel', 'Kode QR Pembayaran')}
                                </p>
                                <div className="flex justify-center rounded-lg border border-[#DCE3EC] bg-white p-4">
                                    <img src={pendingInvoice.qr_code_url} alt="QR Code Pembayaran" className="h-48 w-48 object-contain" />
                                </div>
                                <Button asChild variant="outline" className="w-full h-10">
                                    <a href={pendingInvoice.qr_code_url} download>
                                        <Download className="h-4 w-4" />
                                        {t('webinar.register.btnDownloadQr', 'Download QR Code')}
                                    </a>
                                </Button>
                            </div>
                        )}

                        {/* Payment Instructions */}
                        {instructions && instructions.length > 0 && (
                            <div className="space-y-3 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                <p className="text-sm font-semibold text-[#12344E]">
                                    {t('webinar.register.paymentStepsTitle', 'Langkah Pembayaran')}
                                </p>
                                <div className="space-y-2.5">
                                    {instructions.map((instruction, idx) => (
                                        <details key={idx} className="group overflow-hidden rounded-lg border border-[#DCE3EC] bg-white" open={idx === 0}>
                                            <summary className="flex min-h-11 cursor-pointer items-center justify-between px-4 py-2.5 text-sm font-semibold text-[#162230] hover:bg-[#F8FAFC]">
                                                <span>{instruction.title}</span>
                                                <span className="text-xs text-[#5B6B7F] transition-transform group-open:rotate-180">▼</span>
                                            </summary>
                                            <div className="border-t border-[#DCE3EC] px-4 py-3">
                                                <ol className="space-y-2.5">
                                                    {instruction.steps.map((step, stepIdx) => (
                                                        <li key={stepIdx} className="flex items-start gap-3">
                                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#12344E] text-xs font-semibold text-white">
                                                                {stepIdx + 1}
                                                            </span>
                                                            <div
                                                                className="flex-1 pt-0.5 text-sm leading-relaxed text-[#475569]"
                                                                dangerouslySetInnerHTML={{ __html: step }}
                                                            />
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        </details>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Actions */}
                <div className="space-y-2.5 pt-1">
                    {pendingInvoice.invoice_url && !isExpired && (
                        <Button asChild className="h-12 w-full text-base font-semibold" size="lg">
                            <a href={pendingInvoice.invoice_url}>
                                <ExternalLink className="h-4 w-4" />
                                {t('webinar.register.btnContinuePayment', 'Lanjutkan Pembayaran')}
                            </a>
                        </Button>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                            type="button"
                            onClick={onCheckStatus || (() => window.location.reload())}
                            variant="outline"
                            className="h-11 flex-1"
                            size="lg"
                        >
                            {t('webinar.register.btnCheckStatus', 'Cek Status')}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            className="h-11 flex-1 border-[#FECACA] text-[#B91C1C] hover:border-[#B91C1C] hover:bg-[#FEF2F2] hover:text-[#B91C1C]"
                            size="lg"
                            disabled={cancellingInvoice}
                            onClick={onCancel}
                        >
                            {cancellingInvoice
                                ? t('webinar.register.cancelling', 'Membatalkan...')
                                : t('webinar.register.btnCancelOrder', 'Batalkan Pesanan')}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
