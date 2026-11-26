import { CheckoutHeader } from '@/components/checkout-header';
import { PaymentStatusCard } from '@/components/payment-status-card';
import { ProgramBadge } from '@/components/program-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { resolveStorageUrl } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { BadgeCheck, Check, ChevronDown, LoaderCircle, Shield, Tag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import axios from 'axios';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import InstallmentOptions, { InstallmentTermOption, ActiveInstallmentData } from '@/components/installment-options';
import { useTranslation } from 'react-i18next';

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    key_points?: string | null;
    level: 'beginner' | 'intermediate' | 'advanced';
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            attachment?: string | null;
            video_url?: string | null;
            is_free?: boolean;
        }[];
    }[];
}

interface DiscountData {
    valid: boolean;
    discount_amount: number;
    final_amount: number;
    discount_code: {
        id: string;
        code: string;
        name: string;
        type: string;
        formatted_value: string;
    };
    message?: string;
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface PaymentInstruction {
    title: string;
    steps: string[];
}

interface TransactionDetail {
    reference: string;
    payment_name: string;
    pay_code: string;
    instructions: PaymentInstruction[];
    status: string;
    paid_at?: string | null;
}

interface PendingInvoice {
    id: string;
    invoice_code: string;
    status: string;
    amount: number;
    payment_method: string;
    invoice_url?: string | null;
    // payment_channel: string;
    va_number?: string;
    qr_code_url?: string;
    bank_name?: string;
    created_at: string;
    expires_at: string;
}

interface InvoiceData {
    type: string;
    id: string;
    discount_amount: number;
    nett_amount: number;
    total_amount: number;
    // payment_channel?: string;
    discount_code_id?: string;
    discount_code_amount?: number;
    points_redeemed?: number;
    referral_code?: string;
}

export default function CheckoutCourse({
    course,
    hasAccess,
    activeInstallment: initialActiveInstallment = null,
    pendingInvoice,
    transactionDetail,
    // channels,
    referralInfo,
    installmentTerms = [],
}: {
    course: Course;
    hasAccess: boolean;
    activeInstallment?: ActiveInstallmentData | null;
    pendingInvoice?: PendingInvoice | null;
    transactionDetail?: TransactionDetail | null;
    // channels: PaymentChannel[];
    referralInfo: ReferralInfo;
    installmentTerms?: InstallmentTermOption[];
}) {
    const { t } = useTranslation('user');
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number;

    const [activeInstallment, setActiveInstallment] = useState<ActiveInstallmentData | null>(initialActiveInstallment || null);
    const [paymentMode, setPaymentMode] = useState<'full' | 'installment'>(initialActiveInstallment ? 'installment' : 'full');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [cancellingInvoice, setCancellingInvoice] = useState(false);
    const [codeType, setCodeType] = useState<'voucher' | 'referral'>('voucher');
    const [userPoints, setUserPoints] = useState(0);
    const [pointsChecked, setPointsChecked] = useState(false);
    const [pointsToUse, setPointsToUse] = useState(0);
    const [pointsError, setPointsError] = useState('');

    const [promoCode, setPromoCode] = useState('');
    const [promoOpen, setPromoOpen] = useState(false);
    const [discountData, setDiscountData] = useState<DiscountData | null>(null);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');

    const [referralData, setReferralData] = useState<{ valid: boolean; referrer?: { name: string } } | null>(null);
    const [referralLoading, setReferralLoading] = useState(false);
    const [referralError, setReferralError] = useState('');

    const isFree = course.price === 0;

    const basePrice = course.price;
    const discountAmount = discountData?.valid ? discountData.discount_amount : 0;
    const maxPointsAllowed = basePrice - discountAmount;

    const finalCoursePrice = basePrice - discountAmount - (pointsChecked ? pointsToUse : 0);
    const adminFee = isFree ? 0 : 5000;
    const totalPrice = isFree ? 0 : finalCoursePrice + adminFee;

    // Load points balance on mount
    useEffect(() => {
        if (isLoggedIn) {
            axios.get('/api/user/points')
                .then((response) => {
                    setUserPoints(response.data.point_balance || 0);
                })
                .catch((err) => {
                    console.error('Failed to load points balance:', err);
                });
        }
    }, [isLoggedIn]);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        }
    }, [referralInfo]);

    const validateReferralCode = async () => {
        if (!promoCode.trim() || isFree) return;

        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await axios.post('/api/referral/validate', {
                code: promoCode,
            });
            const data = response.data;

            if (data.valid) {
                setReferralData(data);
                setReferralError('');
            } else {
                setReferralData(null);
                setReferralError(data.message || 'Kode referral tidak valid');
            }
        } catch (error: any) {
            setReferralData(null);
            setReferralError(error.response?.data?.message || 'Terjadi kesalahan saat memvalidasi kode referral');
        } finally {
            setReferralLoading(false);
        }
    };

    useEffect(() => {
        if (!promoCode.trim() || isFree) {
            setDiscountData(null);
            setReferralData(null);
            setPromoError('');
            setReferralError('');
            return;
        }

        const timer = setTimeout(() => {
            if (codeType === 'voucher') {
                validatePromoCode();
            } else {
                validateReferralCode();
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [promoCode, codeType]);

    const validatePromoCode = async () => {
        if (!promoCode.trim() || isFree) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const response = await fetch('/api/discount-codes/validate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    code: promoCode,
                    amount: course.price,
                    product_type: 'course',
                    product_id: course.id,
                }),
            });

            const data = await response.json();

            if (data.valid) {
                setDiscountData(data);
                setPromoError('');
            } else {
                setDiscountData(null);
                setPromoError(data.message || 'Kode promo tidak valid');
            }
        } catch {
            setDiscountData(null);
            setPromoError('Terjadi kesalahan saat memvalidasi kode promo');
        } finally {
            setPromoLoading(false);
        }
    };

    const refreshCSRFToken = async (): Promise<string> => {
        try {
            const response = await fetch('/csrf-token', {
                method: 'GET',
                credentials: 'same-origin',
            });
            const data = await response.json();

            const metaTag = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement;
            if (metaTag) {
                metaTag.content = data.token;
            }

            return data.token;
        } catch (error) {
            console.error('Failed to refresh CSRF token:', error);
            throw error;
        }
    };

    const handleFreeCheckout = (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoggedIn) {
            toast.error(t('course.checkout.loginRequiredDesc', 'Silakan login terlebih dahulu untuk melanjutkan checkout kelas'));
            window.location.href = route('login', { redirect: window.location.href });
            return;
        }

        if (!isProfileComplete) {
            alert('Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu.');
            window.location.href = route('profile.edit');
            return;
        }

        setLoading(true);

        router.post(
            route('enroll.free'),
            {
                type: 'course',
                id: course.id,
            },
            {
                onError: (errors) => {
                    console.log('Free enrollment errors:', errors);
                    alert(errors.message || 'Gagal mendaftar kelas gratis.');
                },
                onFinish: () => {
                    setLoading(false);
                },
            },
        );
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isLoggedIn) {
            toast.error(t('course.checkout.loginRequiredDesc', 'Silakan login terlebih dahulu untuk melanjutkan checkout kelas'));
            window.location.href = route('login', { redirect: window.location.href });
            return;
        }

        if (!isProfileComplete) {
            alert('Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu.');
            window.location.href = route('profile.edit');
            return;
        }

        if (!termsAccepted && !isFree) {
            alert('Anda harus menyetujui syarat dan ketentuan!');
            return;
        }

        setLoading(true);

        if (isFree) {
            return handleFreeCheckout(e);
        }

        const submitPayment = async (): Promise<void> => {
            const originalDiscountAmount = course.strikethrough_price > 0 ? course.strikethrough_price - course.price : 0;
            const promoDiscountAmount = discountData?.valid ? discountData.discount_amount : 0;
            const pointsDeduction = pointsChecked ? pointsToUse : 0;

            const invoiceData: InvoiceData = {
                type: 'course',
                id: course.id,
                discount_amount: originalDiscountAmount + promoDiscountAmount,
                nett_amount: finalCoursePrice,
                total_amount: totalPrice,
                points_redeemed: pointsDeduction,
            };

            if (discountData?.valid && codeType === 'voucher') {
                invoiceData.discount_code_id = discountData.discount_code.id;
                invoiceData.discount_code_amount = discountData.discount_amount;
            }

            if (codeType === 'referral' && referralData?.valid) {
                invoiceData.referral_code = promoCode;
            }

            const storedAffiliate = sessionStorage.getItem('affiliate_code');
            if (storedAffiliate) {
                (invoiceData as any).affiliate_code = storedAffiliate;
            }

            try {
                const res = await axios.post(route('invoice.store'), invoiceData);

                if (res.data && res.data.success) {
                    if (res.data.payment_url) {
                        window.location.href = res.data.payment_url;
                    } else {
                        throw new Error('Payment URL not received');
                    }
                } else {
                    throw new Error(res.data?.message || 'Gagal membuat invoice.');
                }
            } catch (error) {
                console.error('Payment error:', error);
                throw error;
            }
        };

        try {
            await submitPayment();
        } catch (error: any) {
            alert(error.message || 'Terjadi kesalahan saat proses pembayaran.');
            setLoading(false);
        }
    };

    // Get level badge
    const getLevelBadge = (level: string) => {
        switch (level) {
            case 'beginner':
                return (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                        Beginner
                    </span>
                );
            case 'intermediate':
                return (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                        Intermediate
                    </span>
                );
            case 'advanced':
                return (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-900/30 dark:text-red-300">
                        Advanced
                    </span>
                );
            default:
                return null;
        }
    };

    // const getPaymentChannelName = (code: string): string => {
    //     const channel = channels.find((c) => c.code === code);
    //     return channel?.name || code;
    // };

    // const getPaymentGroupIcon = (channelCode: string): string => {
    //     const channel = channels.find((c) => c.code === channelCode);
    //     return channel?.icon_url || '';
    // };

    const formatExpiryTime = (expiresAt?: string | null): { time: string; status: 'expired' | 'urgent' | 'normal' } => {
        if (!expiresAt) return { time: 'Normal', status: 'normal' };
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) {
            return { time: 'Sudah kadaluarsa', status: 'expired' };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours < 1) {
            return { time: `${minutes} menit lagi`, status: 'urgent' };
        }

        return { time: `${hours} jam ${minutes} menit lagi`, status: hours < 3 ? 'urgent' : 'normal' };
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success('Berhasil menyalin ke clipboard!');
        });
    };

    if (isLoggedIn && !isProfileComplete) {
        return (
            <div className="min-h-screen bg-[#FAF8F4]">
                <Head title={t('course.checkout.title', 'Checkout Kelas')} />
                <CheckoutHeader backHref={route('course.detail', course.slug)} />
                <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md rounded-2xl border border-[#DCE3EC] bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3EB]">
                            <User className="h-7 w-7 text-[#D95B16]" />
                        </div>
                        <h1 className="font-literata mb-2 text-2xl font-bold text-[#12344E]">
                            {t('course.checkout.profileIncompleteTitle', 'Profil Belum Lengkap')}
                        </h1>
                        <p className="mb-6 text-sm leading-relaxed text-[#475569]">
                            {t('course.checkout.profileIncompleteDesc', 'Harap lengkapi nomor telepon terlebih dahulu untuk melanjutkan checkout')}
                        </p>
                        <Button asChild className="h-11 w-full font-semibold" size="lg">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>
                                {t('course.checkout.btnCompleteProfile', 'Lengkapi Profil')}
                            </Link>
                        </Button>
                    </div>
                </section>
            </div>
        );
    }

    const promoApplied = (codeType === 'voucher' && !!discountData?.valid) || (codeType === 'referral' && !!referralData?.valid);
    const showDisabledReason = !isFree && !termsAccepted && !loading && !activeInstallment;

    return (
        <div className="min-h-screen bg-[#FAF8F4]">
            <Head title={t('course.checkout.title', 'Checkout Kelas')} />
            <CheckoutHeader backHref={route('course.detail', course.slug)} />

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="mb-6">
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#5B6B7F] sm:text-sm">
                        <Link href="/course" className="transition-colors hover:text-[#1976D3]">
                            {t('course.checkout.crumbCourse', 'Kelas')}
                        </Link>
                        <span>/</span>
                        <Link href={`/course/${course.slug}`} className="max-w-[240px] truncate transition-colors hover:text-[#1976D3] sm:max-w-md">
                            {course.title}
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-[#12344E]">Checkout</span>
                    </nav>
                    <h1 className="font-literata mt-3 text-2xl font-bold text-[#12344E] sm:text-3xl">
                        {t('course.checkout.title', 'Checkout Kelas')}
                    </h1>
                </div>

                <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                    {/* Product Info */}
                    <div className={!pendingInvoice ? 'space-y-6 lg:col-span-7' : 'space-y-6 lg:col-span-12'}>
                        <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                            <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-3.5">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5B6B7F]">
                                    {t('webinar.register.programInfoTitle', 'Program Dipilih')}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] sm:w-36">
                                    <img
                                        src={resolveStorageUrl(course.thumbnail) || '/assets/images/placeholder.png'}
                                        alt={course.title}
                                        className="h-full w-full object-contain p-1.5"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ProgramBadge type="course" />
                                        {getLevelBadge(course.level)}
                                    </div>
                                    <h3 className="font-literata text-lg font-bold leading-snug text-[#12344E]">{course.title}</h3>
                                </div>
                            </div>
                        </div>

                        {!isLoggedIn && !pendingInvoice && (
                            <div className="flex flex-col justify-between gap-3 rounded-2xl border border-[#FDE68A] bg-[#FEFCE8] p-5 sm:flex-row sm:items-center">
                                <div>
                                    <p className="text-sm font-semibold text-[#854D0E]">
                                        {t('course.checkout.loginRequiredTitle', 'Masuk Akun untuk Melanjutkan')}
                                    </p>
                                    <p className="mt-0.5 text-xs leading-relaxed text-[#A16207]">
                                        {t('course.checkout.loginRequiredDesc', 'Silakan login terlebih dahulu untuk melanjutkan checkout kelas')}
                                    </p>
                                </div>
                                <Button asChild size="sm" variant="outline" className="h-10 shrink-0 border-[#F59E0B] bg-white text-[#854D0E] hover:bg-[#FEF3C7]">
                                    <Link href={route('login', { redirect: window.location.href })}>
                                        {t('course.checkout.btnLogin', 'Masuk / Daftar')}
                                    </Link>
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Payment Section */}
                    <div className={!pendingInvoice ? 'lg:sticky lg:top-24 lg:col-span-5' : 'lg:col-span-12'}>
                        {hasAccess && (!activeInstallment || activeInstallment.is_fully_paid) ? (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-[#BBF7D0] bg-white p-6 text-center shadow-sm">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
                                    <BadgeCheck className="h-7 w-7 text-[#15803D]" />
                                </div>
                                <div>
                                    <h2 className="font-literata mb-1.5 text-xl font-bold text-[#12344E]">
                                        {t('course.checkout.hasAccessTitle', 'Sudah Memiliki Akses')}
                                    </h2>
                                    <p className="text-sm text-[#475569]">
                                        {t('course.checkout.hasAccessDesc', 'Anda sudah terdaftar di kelas ini. Silakan lanjutkan belajar.')}
                                    </p>
                                </div>
                                <Button asChild className="h-11 w-full bg-[#15803D] text-white hover:bg-[#166534]" size="lg">
                                    <a href={`/profile/my-courses/${course.slug}`}>{t('course.checkout.enterCourse', 'Masuk ke Kelas')}</a>
                                </Button>
                            </div>
                        ) : pendingInvoice ? (
                            <PaymentStatusCard
                                pendingInvoice={pendingInvoice}
                                expiryInfo={formatExpiryTime(pendingInvoice.expires_at)}
                                instructions={transactionDetail?.instructions}
                                cancellingInvoice={cancellingInvoice}
                                onCopy={copyToClipboard}
                                onCancel={async () => {
                                    if (confirm('Apakah Anda yakin ingin membatalkan transaksi ini dan membuat pesanan baru?')) {
                                        setCancellingInvoice(true);
                                        try {
                                            await axios.post(route('invoice.cancel', pendingInvoice.id));
                                            toast.success('Pesanan berhasil dibatalkan.');
                                            window.location.reload();
                                        } catch (err: any) {
                                            toast.error(err.response?.data?.message || 'Gagal membatalkan pesanan.');
                                            setCancellingInvoice(false);
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                                <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                    <h2 className="font-literata text-lg font-bold text-[#12344E]">
                                        {isFree ? t('course.checkout.regDetail', 'Detail Pendaftaran') : t('course.checkout.summaryTitle', 'Ringkasan Pembayaran')}
                                    </h2>
                                </div>

                                <div className="space-y-5 p-5 sm:p-6">
                                    {((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) &&
                                        !isFree && (
                                            <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMode('full')}
                                                    disabled={!!activeInstallment && !activeInstallment.is_fully_paid}
                                                    className={`min-h-10 rounded-lg text-xs font-semibold transition-colors ${
                                                        paymentMode === 'full'
                                                            ? 'bg-white text-[#12344E] shadow-xs'
                                                            : 'text-[#5B6B7F] hover:text-[#12344E]'
                                                    } ${activeInstallment && !activeInstallment.is_fully_paid ? 'cursor-not-allowed opacity-50' : ''}`}
                                                >
                                                    {t('course.checkout.tabFull', 'Bayar Lunas (Full)')}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setPaymentMode('installment')}
                                                    className={`min-h-10 rounded-lg text-xs font-semibold transition-colors ${
                                                        paymentMode === 'installment'
                                                            ? 'bg-white text-[#12344E] shadow-xs'
                                                            : 'text-[#5B6B7F] hover:text-[#12344E]'
                                                    }`}
                                                >
                                                    {t('course.checkout.tabInstallment', 'Cicilan')} (
                                                    {activeInstallment && !activeInstallment.is_fully_paid
                                                        ? activeInstallment.total_terms || activeInstallment.terms?.length
                                                        : installmentTerms.length}
                                                    x)
                                                </button>
                                            </div>
                                        )}

                                    {paymentMode === 'installment' &&
                                    ((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) &&
                                    !isFree ? (
                                        <InstallmentOptions
                                            productType="course"
                                            productId={course.id}
                                            productPrice={course.price}
                                            terms={installmentTerms}
                                            activeInstallment={activeInstallment}
                                            termsAccepted={termsAccepted}
                                            onTermsAcceptedChange={setTermsAccepted}
                                            onBeforePay={async () => {
                                                if (!activeInstallment && !termsAccepted) {
                                                    toast.error('Anda harus menyetujui syarat dan ketentuan!');
                                                    return false;
                                                }
                                                if (!isLoggedIn) {
                                                    toast.error(
                                                        t('course.checkout.loginRequiredDesc', 'Silakan login terlebih dahulu untuk melanjutkan checkout kelas'),
                                                    );
                                                    window.location.href = route('login', { redirect: window.location.href });
                                                    return false;
                                                }
                                                if (!isProfileComplete) {
                                                    alert('Profil Anda belum lengkap! Harap lengkapi nomor telepon terlebih dahulu.');
                                                    window.location.href = route('profile.edit');
                                                    return false;
                                                }
                                                return true;
                                            }}
                                        />
                                    ) : (
                                        <form onSubmit={handleCheckout} className="space-y-5">
                                            {isFree ? (
                                                <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-center">
                                                    <p className="font-literata text-xl font-bold text-[#15803D]">
                                                        {t('course.checkout.freeCourse', 'KELAS GRATIS')}
                                                    </p>
                                                    <p className="mt-1.5 text-sm text-[#166534]">
                                                        {t('course.checkout.freeCourseDesc', 'Dapatkan akses penuh secara gratis')}
                                                    </p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Collapsible Voucher / Referral */}
                                                    <Collapsible open={promoOpen || promoApplied} onOpenChange={setPromoOpen}>
                                                        <CollapsibleTrigger asChild>
                                                            <button
                                                                type="button"
                                                                className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] px-4 py-2.5 text-left text-sm font-semibold text-[#12344E] transition-colors hover:border-[#93C5FD]"
                                                            >
                                                                <span className="flex items-center gap-2">
                                                                    <Tag className="h-4 w-4 text-[#1976D3]" />
                                                                    <span>
                                                                        {t('webinar.register.havePromoCode', 'Punya kode voucher atau referral?')}
                                                                    </span>
                                                                    {promoApplied && (
                                                                        <span className="rounded-full bg-[#DCFCE7] px-2 py-0.5 text-[11px] font-semibold text-[#15803D]">
                                                                            {t('webinar.register.codeAppliedTag', 'Aktif')}
                                                                        </span>
                                                                    )}
                                                                </span>
                                                                <ChevronDown
                                                                    className={`h-4 w-4 text-[#5B6B7F] transition-transform ${
                                                                        promoOpen || promoApplied ? 'rotate-180' : ''
                                                                    }`}
                                                                />
                                                            </button>
                                                        </CollapsibleTrigger>
                                                        <CollapsibleContent className="pt-3">
                                                            <div className="space-y-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                                                <div className="space-y-1.5">
                                                                    <Label className="text-xs font-semibold uppercase tracking-wide text-[#5B6B7F]">
                                                                        {t('course.checkout.codeType', 'Jenis Kode')}
                                                                    </Label>
                                                                    <RadioGroup
                                                                        value={codeType}
                                                                        onValueChange={(val: 'voucher' | 'referral') => {
                                                                            setCodeType(val);
                                                                            setPromoCode('');
                                                                            setDiscountData(null);
                                                                            setReferralData(null);
                                                                            setPromoError('');
                                                                            setReferralError('');
                                                                            if (val === 'voucher') {
                                                                                setPointsChecked(false);
                                                                                setPointsToUse(0);
                                                                            }
                                                                        }}
                                                                        className="flex gap-5 pt-1"
                                                                    >
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="voucher" id="code-voucher" />
                                                                            <Label htmlFor="code-voucher" className="cursor-pointer text-sm text-[#162230]">
                                                                                {t('course.checkout.voucher', 'Voucher')}
                                                                            </Label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="referral" id="code-referral" />
                                                                            <Label htmlFor="code-referral" className="cursor-pointer text-sm text-[#162230]">
                                                                                {t('course.checkout.referral', 'Referral')}
                                                                            </Label>
                                                                        </div>
                                                                    </RadioGroup>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <Label htmlFor="promo-code" className="text-xs font-semibold text-[#162230]">
                                                                        {codeType === 'voucher'
                                                                            ? t('course.checkout.voucherCode', 'Kode Voucher / Promo')
                                                                            : t('course.checkout.referralCode', 'Kode Referral')}
                                                                    </Label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            id="promo-code"
                                                                            type="text"
                                                                            placeholder={
                                                                                codeType === 'voucher'
                                                                                    ? t('course.checkout.enterPromo', 'Masukkan kode promo')
                                                                                    : t('course.checkout.enterReferral', 'Masukkan kode referral')
                                                                            }
                                                                            value={promoCode}
                                                                            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                                            className="pr-10"
                                                                        />
                                                                        {(promoLoading || referralLoading) && (
                                                                            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                                                <LoaderCircle className="h-4 w-4 animate-spin text-[#1976D3]" />
                                                                            </div>
                                                                        )}
                                                                        {!(promoLoading || referralLoading) && promoCode && (
                                                                            <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                                                {codeType === 'voucher' ? (
                                                                                    discountData?.valid ? (
                                                                                        <Check className="h-5 w-5 text-[#15803D]" />
                                                                                    ) : promoError ? (
                                                                                        <X className="h-5 w-5 text-[#B91C1C]" />
                                                                                    ) : null
                                                                                ) : referralData?.valid ? (
                                                                                    <Check className="h-5 w-5 text-[#15803D]" />
                                                                                ) : referralError ? (
                                                                                    <X className="h-5 w-5 text-[#B91C1C]" />
                                                                                ) : null}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {codeType === 'voucher' && promoError && (
                                                                        <p className="text-xs font-medium text-[#B91C1C]">{promoError}</p>
                                                                    )}
                                                                    {codeType === 'voucher' && discountData?.valid && (
                                                                        <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <Check className="h-4 w-4 text-[#15803D]" />
                                                                                <p className="text-xs font-semibold text-[#15803D]">
                                                                                    Promo "{discountData.discount_code.code}" diterapkan!
                                                                                </p>
                                                                            </div>
                                                                            <p className="mt-1 text-xs text-[#166534]">
                                                                                {discountData.discount_code.name}
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                    {codeType === 'referral' && referralError && (
                                                                        <p className="text-xs font-medium text-[#B91C1C]">{referralError}</p>
                                                                    )}
                                                                    {codeType === 'referral' && referralData?.valid && (
                                                                        <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <Check className="h-4 w-4 text-[#15803D]" />
                                                                                <p className="text-xs font-semibold text-[#15803D]">Kode referral valid!</p>
                                                                            </div>
                                                                            <p className="mt-1 text-xs text-[#166534]">
                                                                                Pembelian pertama Anda dirujuk oleh {referralData.referrer?.name}. Reward poin
                                                                                akan masuk setelah pembayaran sukses.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CollapsibleContent>
                                                    </Collapsible>

                                                    {/* Point Reward/Redeem Section */}
                                                    {isLoggedIn && userPoints > 0 && (
                                                        <div className="space-y-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="space-y-0.5">
                                                                    <Label className="text-sm font-semibold text-[#12344E]">
                                                                        {t('course.checkout.usePoints', 'Gunakan Reward Point')}
                                                                    </Label>
                                                                    <p className="text-xs text-[#475569]">
                                                                        Anda memiliki {userPoints.toLocaleString('id-ID')} poin (Rp{' '}
                                                                        {userPoints.toLocaleString('id-ID')})
                                                                    </p>
                                                                </div>
                                                                <Switch
                                                                    checked={pointsChecked}
                                                                    disabled={codeType === 'voucher' && !!discountData?.valid}
                                                                    onCheckedChange={(checked) => {
                                                                        setPointsChecked(checked);
                                                                        if (checked) {
                                                                            const autoPoints = Math.min(userPoints, maxPointsAllowed);
                                                                            setPointsToUse(autoPoints);
                                                                            setPointsError('');
                                                                        } else {
                                                                            setPointsToUse(0);
                                                                            setPointsError('');
                                                                        }
                                                                    }}
                                                                />
                                                            </div>

                                                            {pointsChecked && (
                                                                <div className="space-y-2 pt-1">
                                                                    <Label htmlFor="points-input" className="text-xs font-medium text-[#475569]">
                                                                        {t('course.checkout.pointsToUse', 'Jumlah poin yang digunakan')}
                                                                    </Label>
                                                                    <div className="flex items-center gap-2">
                                                                        <Input
                                                                            id="points-input"
                                                                            type="number"
                                                                            max={Math.min(userPoints, maxPointsAllowed)}
                                                                            min={1}
                                                                            value={pointsToUse || ''}
                                                                            onChange={(e) => {
                                                                                const val = parseInt(e.target.value) || 0;
                                                                                if (val > userPoints) {
                                                                                    setPointsError('Poin melebihi saldo Anda.');
                                                                                } else if (val > maxPointsAllowed) {
                                                                                    setPointsError(
                                                                                        `Maksimal poin yang dapat digunakan adalah ${maxPointsAllowed}.`,
                                                                                    );
                                                                                } else {
                                                                                    setPointsError('');
                                                                                }
                                                                                setPointsToUse(val);
                                                                            }}
                                                                        />
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="h-11 shrink-0"
                                                                            onClick={() => {
                                                                                setPointsToUse(Math.min(userPoints, maxPointsAllowed));
                                                                                setPointsError('');
                                                                            }}
                                                                        >
                                                                            {t('course.checkout.maxPoints', 'Maksimal')}
                                                                        </Button>
                                                                    </div>
                                                                    {pointsError && <p className="text-xs font-medium text-[#B91C1C]">{pointsError}</p>}
                                                                    {codeType === 'voucher' && !!discountData?.valid && (
                                                                        <p className="text-xs text-[#A16207]">
                                                                            {t(
                                                                                'course.checkout.pointsConflict',
                                                                                'Poin tidak dapat digunakan bersamaan dengan kode voucher.',
                                                                            )}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Price Breakdown */}
                                                    <div className="space-y-2.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                                        {course.strikethrough_price > 0 && (
                                                            <>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-[#475569]">
                                                                        {t('course.checkout.originalPrice', 'Harga Asli')}
                                                                    </span>
                                                                    <span className="text-[#5B6B7F] line-through tabular-nums">
                                                                        Rp {course.strikethrough_price.toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-[#475569]">
                                                                        {t('course.checkout.discount', 'Diskon')}
                                                                    </span>
                                                                    <span className="font-semibold text-[#15803D] tabular-nums">
                                                                        -Rp {(course.strikethrough_price - course.price).toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-[#475569]">
                                                                {t('course.checkout.coursePrice', 'Harga Kelas')}
                                                            </span>
                                                            <span className="font-semibold text-[#162230] tabular-nums">
                                                                Rp {course.price.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>

                                                        {discountData?.valid && codeType === 'voucher' && (
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-[#475569]">
                                                                    {t('course.checkout.promoDiscount', 'Diskon Promo')} ({discountData.discount_code.code})
                                                                </span>
                                                                <span className="font-semibold text-[#15803D] tabular-nums">
                                                                    -Rp {discountData.discount_amount.toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {pointsChecked && pointsToUse > 0 && !pointsError && (
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-[#475569]">
                                                                    {t('course.checkout.pointsDiscount', 'Potongan Poin')}
                                                                </span>
                                                                <span className="font-semibold text-[#15803D] tabular-nums">
                                                                    -Rp {pointsToUse.toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-[#475569]">
                                                                {t('course.checkout.adminFee', 'Biaya Transaksi')}
                                                            </span>
                                                            <span className="font-medium text-[#162230] tabular-nums">
                                                                Rp {adminFee.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>

                                                        <Separator className="bg-[#DCE3EC]" />

                                                        <div className="flex items-center justify-between pt-1">
                                                            <span className="font-semibold text-[#12344E]">
                                                                {t('course.checkout.totalPayment', 'Total Pembayaran')}
                                                            </span>
                                                            <span className="font-literata text-2xl font-bold text-[#12344E] tabular-nums">
                                                                Rp {totalPrice.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {!isFree && (
                                                <div className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                                    <Checkbox
                                                        id="terms"
                                                        checked={termsAccepted}
                                                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                                        className="mt-0.5"
                                                    />
                                                    <Label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-[#475569] sm:text-sm">
                                                        {t('course.checkout.agreeTerms', 'Saya menyetujui')}{' '}
                                                        <a
                                                            href="/terms-and-conditions"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-semibold text-[#1976D3] hover:underline"
                                                        >
                                                            {t('course.checkout.termsAndConditions', 'syarat dan ketentuan')}
                                                        </a>{' '}
                                                        {t('course.checkout.applicable', 'yang berlaku')}
                                                    </Label>
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <Button
                                                    className="h-12 w-full text-base font-semibold"
                                                    type="submit"
                                                    disabled={(isFree ? false : !termsAccepted) || loading || !!activeInstallment}
                                                    size="lg"
                                                >
                                                    {loading ? (
                                                        <span className="flex items-center gap-2">
                                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                                            {t('course.checkout.processing', 'Memproses...')}
                                                        </span>
                                                    ) : isFree ? (
                                                        t('course.checkout.btnGetFree', 'Dapatkan Akses Gratis')
                                                    ) : (
                                                        t('course.checkout.btnPayNow', 'Bayar Sekarang')
                                                    )}
                                                </Button>

                                                {showDisabledReason && (
                                                    <p className="text-center text-xs text-[#5B6B7F]">
                                                        {t(
                                                            'webinar.register.disabledTermsHint',
                                                            'Centang persetujuan syarat dan ketentuan di atas untuk mengaktifkan tombol bayar.',
                                                        )}
                                                    </p>
                                                )}

                                                {!!activeInstallment && !isFree && (
                                                    <p className="text-center text-xs text-[#A16207]">
                                                        {t(
                                                            'webinar.register.disabledInstallmentHint',
                                                            'Anda memiliki cicilan aktif. Gunakan tab Cicilan di atas untuk membayar termin berikutnya.',
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-center gap-1.5 text-xs text-[#5B6B7F]">
                                                <Shield className="h-3.5 w-3.5 text-[#15803D]" />
                                                <span>{t('course.checkout.securePayment', 'Pembayaran aman dan terenkripsi SSL')}</span>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Toaster position="top-center" richColors />
        </div>
    );
}
