import axios from 'axios';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { format, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { AlertCircle, CheckCircle2, Clock, CreditCard, LogIn, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export interface InstallmentTermOption {
    term_number: number;
    amount: number;
    due_date: string;
}

export interface ActiveInstallmentTerm {
    id: string;
    term_number: number;
    amount: number;
    due_date: string | null;
    status: string;
    paid_at: string | null;
}

export interface ActiveInstallmentData {
    parent_invoice_id: string;
    invoice_code: string;
    status: string;
    amount: number;
    total_terms: number;
    paid_terms: number;
    is_fully_paid: boolean;
    next_term: {
        id: string;
        term_number: number;
        amount: number;
        due_date: string | null;
        is_overdue: boolean;
    } | null;
    terms: ActiveInstallmentTerm[];
}

interface InstallmentOptionsProps {
    productType: string;
    productId: string;
    productPrice: number;
    terms: InstallmentTermOption[];
    activeInstallment?: ActiveInstallmentData | null;
    termsAccepted?: boolean;
    onTermsAcceptedChange?: (accepted: boolean) => void;
    onBeforePay?: () => Promise<boolean> | boolean;
}

function formatDateSafe(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    try {
        const d = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
        return format(d, 'dd MMMM yyyy', { locale: id });
    } catch {
        return String(dateStr);
    }
}

export default function InstallmentOptions({
    productType,
    productId,
    terms,
    activeInstallment,
    termsAccepted,
    onTermsAcceptedChange,
    onBeforePay,
}: InstallmentOptionsProps) {
    const { auth } = usePage<SharedData>().props;
    const [isLoading, setIsLoading] = useState(false);

    const ADMIN_FEE = 5000;
    const isCourse = productType === 'course';

    const hasActiveInstallment = !!activeInstallment && (activeInstallment.terms?.length ?? 0) > 0;
    const isTermOverdueCheck = (dueDateStr?: string | null) => {
        if (isCourse || !dueDateStr) return false;
        try {
            const d = typeof dueDateStr === 'string' ? parseISO(dueDateStr) : new Date(dueDateStr);
            if (isNaN(d.getTime())) return false;
            const endOfDay = new Date(d);
            endOfDay.setHours(23, 59, 59, 999);
            return new Date() > endOfDay;
        } catch {
            return false;
        }
    };

    const isAnyTermOverdue = !isCourse && !hasActiveInstallment && terms.some((t) => isTermOverdueCheck(t.due_date));
    const isFullyPaid = hasActiveInstallment && activeInstallment.is_fully_paid;
    const nextTerm = hasActiveInstallment ? activeInstallment.next_term : null;

    const baseTotalAmount = terms.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const totalAmount = baseTotalAmount + (terms.length * ADMIN_FEE);
    const baseDpAmount = Number(terms[0]?.amount ?? 0);
    const dpAmount = baseDpAmount > 0 ? baseDpAmount + ADMIN_FEE : 0;

    const remainingAmount = hasActiveInstallment
        ? activeInstallment.terms.filter((t) => t.status !== 'paid').reduce((sum, t) => sum + Number(t.amount || 0), 0)
        : totalAmount;

    async function handlePayNextTerm() {
        if (!auth?.user) {
            toast.error('Silakan login terlebih dahulu untuk melanjutkan pembayaran cicilan.');
            window.location.href = `/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`;
            return;
        }
        if (!activeInstallment || !nextTerm) return;

        setIsLoading(true);
        try {
            if (onBeforePay) {
                const canProceed = await onBeforePay();
                if (!canProceed) {
                    setIsLoading(false);
                    return;
                }
            }

            const res = await axios.post(`/installment/${activeInstallment.parent_invoice_id}/pay`);

            if (res.data.success && res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data.message || 'Gagal memproses pembayaran termin');
                setIsLoading(false);
            }
        } catch (error: any) {
            setIsLoading(false);
            if (error.response?.status === 401) {
                toast.error('Silakan lengkapi data diri atau masuk terlebih dahulu.');
            } else {
                toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memproses pembayaran termin.');
            }
        }
    }

    async function handlePayInstallment() {
        if (isAnyTermOverdue) {
            toast.error('Masa pendaftaran / termin cicilan untuk program ini telah terlewati.');
            return;
        }

        if (!auth?.user) {
            toast.error('Silakan login terlebih dahulu untuk melanjutkan pembayaran cicilan.');
            window.location.href = `/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`;
            return;
        }

        if (termsAccepted !== undefined && !termsAccepted) {
            toast.error('Silakan setujui syarat dan ketentuan terlebih dahulu.');
            return;
        }

        setIsLoading(true);
        try {
            if (onBeforePay) {
                const canProceed = await onBeforePay();
                if (!canProceed) {
                    setIsLoading(false);
                    return;
                }
            }

            const payload: Record<string, unknown> = {
                type: productType,
                id: productId,
            };

            const storedAffiliate = sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref');
            if (storedAffiliate) {
                payload.affiliate_code = storedAffiliate;
            }

            const storedReferral = sessionStorage.getItem('referral_code');
            if (storedReferral) {
                payload.referral_code = storedReferral;
            }

            const res = await axios.post('/invoice/installment', payload);

            if (res.data.success && res.data.payment_url) {
                window.location.href = res.data.payment_url;
            } else {
                toast.error(res.data.message || 'Gagal membuat tagihan cicilan');
                setIsLoading(false);
            }
        } catch (error: any) {
            setIsLoading(false);
            if (error.response?.status === 401) {
                toast.error('Silakan lengkapi data diri pendaftaran atau masuk terlebih dahulu.');
            } else {
                toast.error(error.response?.data?.message || 'Terjadi kesalahan saat memproses pembayaran cicilan.');
            }
        }
    }

    if (terms.length === 0 && !hasActiveInstallment) return null;

    // JIKA CICILAN SUDAH LUNAS SEMUA
    if (isFullyPaid) {
        return (
            <div className="space-y-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#DCFCE7]">
                    <CheckCircle2 className="h-6 w-6 text-[#15803D]" />
                </div>
                <div>
                    <h4 className="font-literata text-base font-bold text-[#12344E]">Semua Cicilan Telah Lunas!</h4>
                    <p className="mt-1 text-xs leading-relaxed text-[#475569]">
                        Anda telah menyelesaikan seluruh {activeInstallment?.total_terms} termin pembayaran untuk program ini.
                    </p>
                </div>
                <Button asChild size="lg" className="w-full bg-[#15803D] text-white hover:bg-[#166534]">
                    <a href="/profile/dashboard">Lihat di Dashboard</a>
                </Button>
            </div>
        );
    }

    // JIKA ADA CICILAN AKTIF (USER SEDANG DALAM PROSES CICILAN, MISAL SUDAH BAYAR DP / TERMIN 1)
    if (hasActiveInstallment && nextTerm) {
        return (
            <div className="space-y-4">
                {/* Banner Info Cicilan Aktif */}
                <div className="flex items-start gap-2.5 rounded-xl border border-[#BFDBFE] bg-[#EAF3FC] p-3.5 text-xs text-[#12344E]">
                    <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[#1976D3]" />
                    <div>
                        <p className="font-semibold">Cicilan Aktif Terdeteksi ({activeInstallment.invoice_code})</p>
                        <p className="mt-0.5 leading-relaxed text-[#475569]">
                            Anda telah membayar <strong>{activeInstallment.paid_terms} dari {activeInstallment.total_terms}</strong> termin. Silakan lanjutkan pembayaran untuk termin berikutnya.
                        </p>
                    </div>
                </div>

                {/* Summary Tagihan Berikutnya & Sisa */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl border border-[#93C5FD] bg-[#FAF8F4] p-3.5">
                        <p className="mb-1 text-xs font-medium text-[#155FA8]">Tagihan Termin ke-{nextTerm.term_number}</p>
                        <p className="font-literata text-xl font-bold text-[#12344E] tabular-nums">{rupiahFormatter.format(nextTerm.amount)}</p>
                    </div>
                    <div className="rounded-xl border border-[#DCE3EC] bg-white p-3.5">
                        <p className="mb-1 text-xs text-[#5B6B7F]">Sisa Pembayaran</p>
                        <p className="font-literata text-xl font-bold text-[#162230] tabular-nums">{rupiahFormatter.format(remainingAmount)}</p>
                    </div>
                </div>

                {/* Daftar Status Termin */}
                <div className="space-y-2.5 rounded-xl border border-[#DCE3EC] bg-white p-4">
                    <div className="flex items-center justify-between border-b border-[#DCE3EC] pb-2">
                        <span className="text-xs font-semibold text-[#12344E]">Status Pembayaran Termin</span>
                        <Badge variant="outline" className="border-[#BFDBFE] bg-[#EAF3FC] text-[11px] font-semibold text-[#155FA8]">
                            {activeInstallment.total_terms}x Termin
                        </Badge>
                    </div>

                    <div className="space-y-2 pt-1">
                        {activeInstallment.terms.map((term) => {
                            const isPaid = term.status === 'paid';
                            const isCurrent = term.term_number === nextTerm.term_number;

                            return (
                                <div
                                    key={term.id}
                                    className={`flex items-center justify-between gap-3 rounded-lg p-2.5 text-xs transition-colors ${
                                        isPaid
                                            ? 'border border-[#BBF7D0] bg-[#F0FDF4]'
                                            : isCurrent
                                              ? 'border border-[#1976D3] bg-[#EAF3FC]/60'
                                              : 'border border-[#DCE3EC] bg-[#FAF8F4] opacity-75'
                                    }`}
                                >
                                    <div className="flex items-center gap-2.5">
                                        <div
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                                isPaid
                                                    ? 'bg-[#15803D] text-white'
                                                    : isCurrent
                                                      ? 'bg-[#1976D3] text-white'
                                                      : 'bg-[#DCE3EC] text-[#475569]'
                                            }`}
                                        >
                                            {isPaid ? <CheckCircle2 className="h-4 w-4" /> : term.term_number}
                                        </div>
                                        <div>
                                            <p className="flex items-center gap-1.5 font-medium text-[#162230]">
                                                {term.term_number === 1 ? 'Termin 1 (DP)' : `Termin ke-${term.term_number}`}
                                                {isPaid && (
                                                    <span className="rounded bg-[#DCFCE7] px-1.5 py-0.5 text-[10px] font-semibold text-[#15803D]">
                                                        Lunas
                                                    </span>
                                                )}
                                                {isCurrent && (
                                                    <span className="rounded bg-[#EAF3FC] px-1.5 py-0.5 text-[10px] font-semibold text-[#155FA8]">
                                                        Bayar Sekarang
                                                    </span>
                                                )}
                                            </p>
                                            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#5B6B7F]">
                                                <Clock className="h-3 w-3" />
                                                {term.due_date ? `Jatuh tempo: ${formatDateSafe(term.due_date)}` : '-'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`font-semibold tabular-nums ${isPaid ? 'text-[#15803D] line-through' : 'text-[#162230]'}`}>
                                        {rupiahFormatter.format(term.amount)}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {nextTerm.is_overdue && (
                    <div className="flex items-start gap-2 rounded-xl border border-[#FDE68A] bg-[#FEFCE8] p-3 text-xs text-[#854D0E]">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#A16207]" />
                        <span>Batas waktu pembayaran telah melewati jatuh tempo. Silakan hubungi admin jika pembayaran online tidak dapat diproses.</span>
                    </div>
                )}

                {/* Tombol Pembayaran Termin Selanjutnya */}
                <Button
                    type="button"
                    className="h-12 w-full gap-2 font-semibold"
                    size="lg"
                    onClick={handlePayNextTerm}
                    disabled={isLoading || nextTerm.is_overdue}
                    id="btn-pay-next-installment"
                >
                    <CreditCard className="h-4 w-4" />
                    {isLoading
                        ? 'Memproses...'
                        : `Bayar Termin ke-${nextTerm.term_number} (${rupiahFormatter.format(nextTerm.amount)})`}
                </Button>
            </div>
        );
    }

    // TAMPILAN AWAL (BELUM ADA CICILAN - BAYAR DP)
    return (
        <div className="space-y-4">
            {/* Banner Login Diperlukan untuk Guest */}
            {!auth?.user && (
                <div className="flex items-start justify-between gap-3 rounded-xl border border-[#FDE68A] bg-[#FEFCE8] p-3.5 text-xs text-[#854D0E]">
                    <div className="flex items-start gap-2.5">
                        <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-[#A16207]" />
                        <div>
                            <p className="font-semibold">Login Diperlukan</p>
                            <p className="mt-0.5 leading-relaxed">
                                Silakan login terlebih dahulu untuk melanjutkan pembayaran cicilan.
                            </p>
                        </div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="shrink-0 border-[#F59E0B] bg-white text-[#854D0E] hover:bg-[#FEF3C7]">
                        <a href={`/login?redirect=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname : '/')}`}>
                            Login
                        </a>
                    </Button>
                </div>
            )}

            {/* Banner Overdue / Cicilan Ditutup */}
            {isAnyTermOverdue && (
                <div className="flex items-start gap-2.5 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3.5 text-xs text-[#B91C1C]">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <div>
                        <p className="font-semibold">Pendaftaran Cicilan Ditutup</p>
                        <p className="mt-0.5 leading-relaxed">
                            Batas waktu pembayaran termin telah terlewat. Anda tidak dapat lagi mendaftar menggunakan opsi cicilan untuk program ini. Silakan gunakan opsi pembayaran penuh jika pendaftaran masih dibuka.
                        </p>
                    </div>
                </div>
            )}
            {/* Summary DP & Total */}
            <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#93C5FD] bg-[#FAF8F4] p-3.5">
                    <p className="mb-1 text-xs font-medium text-[#155FA8]">Bayar Sekarang (DP)</p>
                    <p className="font-literata text-xl font-bold text-[#12344E] tabular-nums">{rupiahFormatter.format(dpAmount)}</p>
                    <p className="mt-0.5 text-[11px] text-[#5B6B7F]">
                        {rupiahFormatter.format(baseDpAmount)} + Admin Rp 5.000
                    </p>
                </div>
                <div className="rounded-xl border border-[#DCE3EC] bg-white p-3.5">
                    <p className="mb-1 text-xs text-[#5B6B7F]">Total Keseluruhan</p>
                    <p className="font-literata text-xl font-bold text-[#162230] tabular-nums">{rupiahFormatter.format(totalAmount)}</p>
                    <p className="mt-0.5 text-[11px] text-[#5B6B7F]">
                        Termasuk admin {terms.length}x transaksi
                    </p>
                </div>
            </div>

            {/* Jadwal Pembayaran */}
            <div className="space-y-2.5 rounded-xl border border-[#DCE3EC] bg-white p-4">
                <div className="flex items-center justify-between border-b border-[#DCE3EC] pb-2">
                    <span className="text-xs font-semibold text-[#12344E]">Jadwal Pembayaran Cicilan</span>
                    <Badge variant="outline" className="border-[#BFDBFE] bg-[#EAF3FC] text-[11px] font-semibold text-[#155FA8]">
                        {terms.length}x Termin
                    </Badge>
                </div>

                <div className="space-y-2 pt-1">
                    {terms.map((term, i) => {
                        const termGross = Number(term.amount) + ADMIN_FEE;
                        return (
                            <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-[#DCE3EC] bg-[#FAF8F4] p-2.5 text-xs">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                                            i === 0 ? 'bg-[#1976D3] text-white' : 'bg-[#DCE3EC] text-[#475569]'
                                        }`}
                                    >
                                        {term.term_number}
                                    </div>
                                    <div>
                                        <p className="font-medium text-[#162230]">{i === 0 ? 'Termin 1 (DP)' : `Termin ke-${term.term_number}`}</p>
                                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-[#5B6B7F]">
                                            <Clock className="h-3 w-3" />
                                            {isCourse
                                                ? (i === 0 ? 'Hari ini (saat pendaftaran)' : `${i * 30} hari setelah pendaftaran`)
                                                : formatDateSafe(term.due_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="shrink-0 text-right">
                                    <span className="font-semibold text-[#162230] tabular-nums">{rupiahFormatter.format(termGross)}</span>
                                    <p className="text-[10px] text-[#5B6B7F]">
                                        {rupiahFormatter.format(term.amount)} + Admin Rp 5.000
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Ketentuan Cicilan */}
            <div className="space-y-1.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-3 text-xs text-[#475569]">
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1976D3]" />
                    <span>Setiap transaksi termin dikenakan biaya admin Rp 5.000.</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803D]" />
                    <span>Akses materi/program langsung aktif segera setelah DP dibayar.</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#15803D]" />
                    <span>Voucher promo dan poin reward tidak dapat digunakan pada pembayaran cicilan.</span>
                </div>
                <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A16207]" />
                    <span>Akses akan ditangguhkan jika cicilan melewati tanggal jatuh tempo.</span>
                </div>
            </div>

            {/* Checkbox Syarat & Ketentuan */}
            {onTermsAcceptedChange && (
                <div className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3">
                    <Checkbox
                        disabled={isAnyTermOverdue}
                        id="installment-terms-checkbox"
                        checked={termsAccepted}
                        onCheckedChange={(checked) => onTermsAcceptedChange(checked === true)}
                        className="mt-0.5"
                    />
                    <Label htmlFor="installment-terms-checkbox" className="cursor-pointer text-xs leading-relaxed text-[#475569]">
                        Saya menyetujui{' '}
                        <a
                            href="/terms-and-conditions"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-semibold text-[#1976D3] hover:underline"
                        >
                            syarat dan ketentuan cicilan
                        </a>
                    </Label>
                </div>
            )}

            {/* Tombol Pembayaran DP */}
            <Button
                type="button"
                className="h-12 w-full gap-2 font-semibold"
                size="lg"
                onClick={handlePayInstallment}
                disabled={isLoading || (termsAccepted !== undefined && !termsAccepted) || isAnyTermOverdue}
                id="btn-pay-installment"
            >
                <CreditCard className="h-4 w-4" />
                {isAnyTermOverdue ? 'Opsi Cicilan Ditutup (Batas Waktu Terlewat)' : isLoading ? 'Memproses...' : `Bayar DP ${rupiahFormatter.format(dpAmount)} (Termasuk Biaya Admin)`}
            </Button>
            {termsAccepted === false && !isAnyTermOverdue && !isLoading && (
                <p className="text-center text-xs text-[#5B6B7F]">
                    Centang persetujuan syarat dan ketentuan cicilan di atas untuk melanjutkan.
                </p>
            )}
        </div>
    );
}
