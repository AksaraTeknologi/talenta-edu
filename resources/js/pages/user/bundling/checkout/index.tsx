import { parseISO } from 'date-fns';
import { CheckoutHeader } from '@/components/checkout-header';
import InputError from '@/components/input-error';
import InstallmentOptions, { ActiveInstallmentData, InstallmentTermOption } from '@/components/installment-options';
import { PaymentStatusCard } from '@/components/payment-status-card';
import { ProgramBadge } from '@/components/program-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { resolveStorageUrl, rupiahFormatter } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BadgeCheck, Calendar, Check, ChevronDown, CreditCard, Gift, LoaderCircle, Package, Play, RefreshCw, Shield, Tag, User, X } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Product {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
}

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable: Product;
    price: number;
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    thumbnail?: string | null;
    batch?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline?: string | null;
    bundle_items: BundleItem[];
    bundle_items_count: number;
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface PaymentInstruction {
    title: string;
    steps: string[];
}

interface PendingInvoice {
    id: string;
    invoice_code: string;
    amount: number;
    status: string;
    invoice_url: string;
    payment_channel?: string;
    payment_method?: string;
    va_number?: string;
    qr_code_url?: string;
    bank_name?: string;
    created_at: string;
    expires_at: string;
}

interface TransactionDetail {
    payment_method?: string;
    payment_channel?: string;
    va_number?: string;
    qr_code_url?: string;
    bank_name?: string;
    created_at: string;
    expires_at: string;
}

type RegisterForm = {
    name: string;
    email: string;
    phone_number: string;
    instance: string;
    city: string;
    password: string;
    password_confirmation: string;
};

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

// interface PaymentChannel {
//     active: boolean;
//     code: string;
//     fee_customer: {
//         flat: number;
//         percent: number;
//     };
//     fee_merchant: {
//         flat: number;
//         percent: number;
//     };
//     group: string;
//     icon_url: string;
//     maximum_amount: number;
//     maximum_fee: number | null;
//     minimum_amount: number;
//     minimum_fee: number | null;
//     name: string;
//     total_fee: {
//         flat: number;
//         percent: string;
//     };
//     type: string;
// }

interface CheckoutBundleProps {
    bundle: Bundle;
    hasAccess: boolean;
    activeInstallment?: ActiveInstallmentData | null;
    pendingInvoice?: PendingInvoice | null;
    transactionDetail?: TransactionDetail | null;
    // channels: PaymentChannel[];
    referralInfo: ReferralInfo;
    installmentTerms?: InstallmentTermOption[];
}

export default function CheckoutBundle({
    bundle,
    hasAccess,
    activeInstallment: initialActiveInstallment = null,
    pendingInvoice,
    transactionDetail,
    referralInfo,
    installmentTerms = [],
}: CheckoutBundleProps) {
    const { t, i18n } = useTranslation('user');
    const { auth } = usePage<SharedData>().props;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number && auth.user?.instance && auth.user?.city;

    const [activeInstallment, setActiveInstallment] = useState<ActiveInstallmentData | null>(initialActiveInstallment);
    const isAnyTermOverdue = !initialActiveInstallment && installmentTerms.some((t: any) => {
        if (!t.due_date) return false;
        try {
            const d = typeof t.due_date === 'string' ? parseISO(t.due_date) : new Date(t.due_date);
            if (isNaN(d.getTime())) return false;
            const endOfDay = new Date(d);
            endOfDay.setHours(23, 59, 59, 999);
            return new Date() > endOfDay;
        } catch {
            return false;
        }
    });

    const [paymentTab, setPaymentTab] = useState<'full' | 'installment'>(initialActiveInstallment ? 'installment' : 'full');
    const [cancellingInvoice, setCancellingInvoice] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [loading, setLoading] = useState(false);
    // const [selectedChannel, setSelectedChannel] = useState<PaymentChannel | null>(channels.length > 0 ? channels[0] : null);

    const bundleDiscount = bundle.strikethrough_price - bundle.price;

    // const calculateAdminFee = (channel: PaymentChannel | null): number => {
    //     if (!channel) return 0;
    //     const flatFee = channel.fee_customer.flat || 0;
    //     const percentFee = Math.round(bundle.price * ((channel.fee_customer.percent || 0) / 100));
    //     return flatFee + percentFee;
    // };

    const adminFee = 5000; //calculateAdminFee(selectedChannel);

    const [emailExists, setEmailExists] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [promoCode, setPromoCode] = useState('');
    const [promoOpen, setPromoOpen] = useState(false);
    const [promoLoading, setPromoLoading] = useState(false);
    const [promoError, setPromoError] = useState('');
    const [discountData, setDiscountData] = useState<DiscountData | null>(null);
    const [codeType, setCodeType] = useState<'voucher' | 'referral'>('voucher');
    const [referralData, setReferralData] = useState<{ valid: boolean; referrer?: { name: string } } | null>(null);
    const [referralLoading, setReferralLoading] = useState(false);
    const [referralError, setReferralError] = useState('');
    const totalPrice = bundle.price + adminFee - (discountData?.discount_amount || 0);

    useEffect(() => {
        if (!promoCode.trim()) {
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

    const validateReferralCode = async () => {
        if (!promoCode.trim()) return;

        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await axios.post('/api/referral/validate', { code: promoCode });
            const responseData = response.data;

            if (responseData.valid) {
                setReferralData(responseData);
                setReferralError('');
            } else {
                setReferralData(null);
                setReferralError(responseData.message || t('bundling.checkout.errors.invalidReferral', 'Kode referral tidak valid'));
            }
        } catch (error: any) {
            setReferralData(null);
            setReferralError(error.response?.data?.message || t('bundling.checkout.errors.referralValidateError', 'Terjadi kesalahan saat memvalidasi kode referral'));
        } finally {
            setReferralLoading(false);
        }
    };

    const validatePromoCode = async () => {
        if (!promoCode.trim()) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const requestData: any = {
                code: promoCode,
                amount: bundle.price,
                product_type: 'bundle',
                product_id: bundle.id,
            };

            if (!isLoggedIn && emailExists && data.email) {
                requestData.email = data.email;
            }

            const response = await axios.post('/api/discount-codes/validate', requestData);

            if (response.data.valid) {
                setDiscountData(response.data);
                setPromoError('');
            } else {
                setDiscountData(null);
                setPromoError(response.data.message || t('bundling.checkout.errors.invalidPromo', 'Kode promo tidak valid'));
            }
        } catch (error: any) {
            setDiscountData(null);
            setPromoError(error.response?.data?.message || t('bundling.checkout.errors.promoValidateError', 'Terjadi kesalahan saat memvalidasi kode promo'));
        } finally {
            setPromoLoading(false);
        }
    };

    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        phone_number: '',
        instance: '',
        city: '',
        password: '',
        password_confirmation: '',
    });

    useEffect(() => {
        if (!data.email || !data.email.includes('@')) {
            setEmailExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingEmail(true);
            try {
                const response = await axios.post('/api/check-email', {
                    email: data.email,
                    bundle_id: bundle.id,
                });

                if (response.data.exists) {
                    setEmailExists(true);
                    setData('name', response.data.name || '');
                    setData('phone_number', response.data.phone_number || '');
                    setData('instance', response.data.instance || '');
                    setData('city', response.data.city || '');

                    if (response.data.active_installment) {
                        setActiveInstallment(response.data.active_installment);
                        setPaymentTab('installment');
                    } else {
                        setActiveInstallment(null);
                    }
                } else {
                    setEmailExists(false);
                    setActiveInstallment(null);
                }
            } catch (error) {
                console.error('Error checking email:', error);
                setEmailExists(false);
                setActiveInstallment(null);
            } finally {
                setCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [data.email, bundle.id]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        }
    }, [referralInfo]);

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

    const ensureAuth = async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!data.email || !data.name || !data.phone_number || !data.instance || !data.city) {
            toast.error(t('bundling.checkout.errors.completePersonalData', 'Lengkapi data terlebih dahulu'));
            return false;
        }

        try {
            if (emailExists) {
                const response = await axios.post('/auto-login', {
                    email: data.email,
                    phone_number: data.phone_number,
                    instance: data.instance,
                    city: data.city,
                });

                if (!response.data.success) {
                    throw new Error(
                        response.data.message ||
                            t('bundling.checkout.errors.autoLoginFailed', 'Login gagal. Pastikan nomor telepon sesuai dengan yang terdaftar.')
                    );
                }
            } else {
                const response = await axios.post('/register', {
                    name: data.name,
                    email: data.email,
                    phone_number: data.phone_number,
                    instance: data.instance,
                    city: data.city,
                    password: data.phone_number,
                    password_confirmation: data.phone_number,
                    affiliate_code: sessionStorage.getItem('affiliate_code') || '',
                });

                if (!(response.data?.success || response.status === 200 || response.status === 201)) {
                    throw new Error(t('bundling.checkout.errors.registerFailed', 'Registrasi gagal.'));
                }
            }
            return true;
        } catch (error: any) {
            console.error('Login/Register error:', error);
            toast.error(error.response?.data?.message || error.message || t('bundling.checkout.errors.processLoginFailed', 'Gagal login/registrasi'));
            return false;
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        if (activeInstallment && !activeInstallment.is_fully_paid) {
            toast.error(
                t(
                    'bundling.checkout.errors.activeInstallmentNotice',
                    'Anda memiliki transaksi cicilan yang sedang aktif. Silakan lanjutkan pembayaran termin cicilan Anda.'
                )
            );
            setPaymentTab('installment');
            return;
        }

        // 1. Jika belum login, lakukan registrasi / login terlebih dahulu
        if (!isLoggedIn) {
            if (!termsAccepted) {
                toast.error(t('bundling.checkout.errors.termsRequired', 'Anda harus menyetujui syarat dan ketentuan!'));
                return;
            }

            setLoading(true);

            const authed = await ensureAuth();
            if (!authed) {
                setLoading(false);
                return;
            }

            try {
                // Langsung jalankan submitPayment tanpa reload!
                await submitPayment();
            } catch (error: any) {
                console.error('Payment error:', error);
                setLoading(false);
                toast.error(error.response?.data?.message || error.message || t('bundling.checkout.errors.paymentFailed', 'Gagal memproses pembayaran'));
            }
            return;
        }

        // 2. Jika sudah login
        if (!termsAccepted) {
            toast.error(t('bundling.checkout.errors.termsRequired', 'Anda harus menyetujui syarat dan ketentuan!'));
            return;
        }

        setLoading(true);

        try {
            await submitPayment();
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || t('bundling.checkout.errors.paymentFailed', 'Terjadi kesalahan saat proses pembayaran.'));
            setLoading(false);
        }
    };

    const submitPayment = async (): Promise<void> => {
        const invoiceData: any = {
            bundle_id: bundle.id,
            discount_amount: bundleDiscount,
            nett_amount: bundle.price - (discountData?.discount_amount || 0),
            transaction_fee: adminFee,
            total_amount: totalPrice,
        };

        if (discountData?.valid && codeType === 'voucher') {
            invoiceData.discount_code_id = discountData.discount_code.id;
            invoiceData.discount_code_amount = discountData.discount_amount;
        }

        if (codeType === 'referral' && referralData?.valid) {
            (invoiceData as any).referral_code = promoCode;
        }

        const storedAffiliate = sessionStorage.getItem('affiliate_code') || new URLSearchParams(window.location.search).get('ref');
        if (storedAffiliate) {
            (invoiceData as any).affiliate_code = storedAffiliate;
        }

        try {
            const res = await axios.post(route('invoice.store.bundle'), invoiceData);

            if (res.data && res.data.success) {
                if (res.data.payment_url) {
                    sessionStorage.removeItem('pendingCheckout');
                    window.location.href = res.data.payment_url;
                } else {
                    throw new Error('Payment URL tidak diterima dari server.');
                }
            } else {
                throw new Error(res.data?.message || t('bundling.checkout.errors.createInvoiceFailed', 'Gagal membuat invoice.'));
            }
        } catch (error: any) {
            console.error('Payment error:', error);
            throw error;
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

    const formatExpiryTime = (expiresAt: string): { time: string; status: 'expired' | 'urgent' | 'normal' } => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) {
            return { time: t('webinar.register.statusExpired', 'Sudah kadaluarsa'), status: 'expired' };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours < 1) {
            return { time: t('webinar.register.minutesLeft', { count: minutes, defaultValue: `${minutes} menit lagi` }), status: 'urgent' };
        }

        return {
            time: t('webinar.register.hoursMinutesLeft', { hours, minutes, defaultValue: `${hours} jam ${minutes} menit lagi` }),
            status: hours < 3 ? 'urgent' : 'normal',
        };
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(t('bundling.checkout.copiedToClipboard', 'Berhasil menyalin ke clipboard!'));
        });
    };

    useEffect(() => {
        const pendingCheckout = sessionStorage.getItem('pendingCheckout');

        if (pendingCheckout && isLoggedIn) {
            try {
                const checkoutData = JSON.parse(pendingCheckout);

                // Validasi timestamp (maksimal 5 menit)
                const timestamp = checkoutData.timestamp || 0;
                const now = Date.now();
                const fiveMinutes = 5 * 60 * 1000;

                if (now - timestamp > fiveMinutes) {
                    sessionStorage.removeItem('pendingCheckout');
                    toast.error(t('bundling.checkout.errors.sessionExpired', 'Sesi checkout telah kadaluarsa'));
                    return;
                }

                // Validasi bundle ID + product type
                if (checkoutData.bundleId !== bundle.id || checkoutData.productType !== 'bundle') {
                    sessionStorage.removeItem('pendingCheckout');
                    return;
                }

                if (checkoutData.source !== 'register') {
                    sessionStorage.removeItem('pendingCheckout');
                    return;
                }

                // Restore state
                setTermsAccepted(checkoutData.termsAccepted || false);

                // Restore promo code jika ada
                if (checkoutData.discountData?.valid) {
                    setPromoCode(checkoutData.discountData.discount_code.code);
                    setDiscountData(checkoutData.discountData);
                }
                toast.success(t('bundling.checkout.continuingPayment', 'Melanjutkan pembayaran...'));

                // Auto-submit setelah delay
                setTimeout(async () => {
                    setLoading(true);

                    const submitPayment = async (retryCount = 0): Promise<void> => {
                        // Hitung ulang total dengan diskon dari sessionStorage
                        let calculatedNettAmount = bundle.price;
                        let calculatedTotalAmount = bundle.price + adminFee;

                        if (checkoutData.discountData?.valid) {
                            calculatedNettAmount = bundle.price - checkoutData.discountData.discount_amount;
                            calculatedTotalAmount = calculatedNettAmount + adminFee;
                        }

                        const invoiceData: any = {
                            bundle_id: bundle.id,
                            discount_amount: bundleDiscount,
                            nett_amount: calculatedNettAmount,
                            transaction_fee: adminFee,
                            total_amount: calculatedTotalAmount,
                        };

                        if (checkoutData.discountData?.valid) {
                            invoiceData.discount_code_id = checkoutData.discountData.discount_code.id;
                            invoiceData.discount_code_amount = checkoutData.discountData.discount_amount;
                        }

                        try {
                            const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;

                            const res = await fetch(route('invoice.store.bundle'), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN': csrfToken || '',
                                    Accept: 'application/json',
                                    'X-Requested-With': 'XMLHttpRequest',
                                },
                                credentials: 'same-origin',
                                body: JSON.stringify(invoiceData),
                            });

                            if (res.status === 419 && retryCount < 2) {
                                await refreshCSRFToken();
                                return submitPayment(retryCount + 1);
                            }

                            if (res.status === 401 && retryCount < 2) {
                                await new Promise((resolve) => setTimeout(resolve, 2000));
                                return submitPayment(retryCount + 1);
                            }

                            const data = await res.json();

                            if (res.ok && data.success) {
                                if (data.payment_url) {
                                    sessionStorage.removeItem('pendingCheckout');
                                    window.location.href = data.payment_url;
                                } else {
                                    throw new Error('Payment URL not received');
                                }
                            } else {
                                throw new Error(data.message || t('bundling.checkout.errors.createInvoiceFailed', 'Gagal membuat invoice.'));
                            }
                        } catch (error) {
                            console.error('Payment error:', error);
                            throw error;
                        }
                    };

                    try {
                        await submitPayment();
                    } catch (error: any) {
                        console.error('Failed to process payment:', error);
                        toast.error(error.message || t('bundling.checkout.errors.paymentFailed', 'Terjadi kesalahan saat proses pembayaran.'));
                        sessionStorage.removeItem('pendingCheckout');
                        setLoading(false);
                    }
                }, 2000);
            } catch (error) {
                console.error('Error processing pending checkout:', error);
                sessionStorage.removeItem('pendingCheckout');
                toast.error(t('bundling.checkout.errors.checkoutFailed', 'Gagal memproses checkout'));
            }
        }
    }, [isLoggedIn, bundle.id]);

    if (isLoggedIn && !isProfileComplete) {
        return (
            <div className="min-h-screen bg-[#FAF8F4]">
                <Head title={t('bundling.checkout.incompleteProfileTitle', 'Lengkapi Profil')} />
                <CheckoutHeader backHref={`/bundle/${bundle.slug}`} />
                <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md rounded-2xl border border-[#DCE3EC] bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3EB]">
                            <User className="h-7 w-7 text-[#D95B16]" />
                        </div>
                        <h1 className="font-literata mb-2 text-2xl font-bold text-[#12344E]">
                            {t('bundling.checkout.incompleteProfileTitle', 'Profil Belum Lengkap')}
                        </h1>
                        <p className="mb-6 text-sm leading-relaxed text-[#475569]">
                            {t(
                                'bundling.checkout.incompleteProfileDesc',
                                'Kami memerlukan nomor telepon, instansi, dan kota domisili Anda untuk melanjutkan pendaftaran paket bundling ini.',
                            )}
                        </p>
                        <Button asChild size="lg" className="h-11 w-full font-semibold">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>
                                <User className="mr-2 h-4 w-4" />
                                {t('bundling.checkout.btnCompleteProfile', 'Lengkapi Profil Sekarang')}
                            </Link>
                        </Button>
                    </div>
                </section>
            </div>
        );
    }

    const promoApplied = (codeType === 'voucher' && !!discountData?.valid) || (codeType === 'referral' && !!referralData?.valid);
    const savePercent = bundle.strikethrough_price > 0 ? Math.round((bundleDiscount / bundle.strikethrough_price) * 100) : 0;
    const handleCopyText = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(t('webinar.register.copySuccess', 'Berhasil menyalin ke clipboard!'));
        });
    };

    return (
        <div className="min-h-screen bg-[#FAF8F4]">
            <Head title={t('bundling.checkout.headTitle', { title: bundle.title, defaultValue: `Checkout - ${bundle.title}` })} />
            <CheckoutHeader backHref={`/bundle/${bundle.slug}`} />

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                {/* Header & Breadcrumb */}
                <div className="mb-6">
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#5B6B7F] sm:text-sm">
                        <Link href="/bundle" className="transition-colors hover:text-[#1976D3]">
                            {t('bundling.dashboard.catalog.badge', 'Paket Bundling')}
                        </Link>
                        <span>/</span>
                        <Link href={`/bundle/${bundle.slug}`} className="max-w-[240px] truncate transition-colors hover:text-[#1976D3] sm:max-w-md">
                            {bundle.title}
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-[#12344E]">Checkout</span>
                    </nav>
                    <h1 className="font-literata mt-3 text-2xl font-bold text-[#12344E] sm:text-3xl">{bundle.title}</h1>
                    {bundle.description && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#475569]">{bundle.description}</p>}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                    {/* Left Column: Bundle Overview, Items, Benefits & Guest Form */}
                    <div className={!pendingInvoice ? 'space-y-6 lg:col-span-7' : 'space-y-6 lg:col-span-12'}>
                        {/* Selected Bundle Card */}
                        <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                            <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-3.5">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5B6B7F]">
                                    {t('webinar.register.programInfoTitle', 'Program Dipilih')}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] sm:w-36">
                                    <img
                                        src={resolveStorageUrl(bundle.thumbnail) || '/assets/images/placeholder.png'}
                                        alt={bundle.title}
                                        className="h-full w-full object-contain p-1.5"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ProgramBadge type="bundle" labelOverride={t('bundling.dashboard.catalog.badge', 'Paket Bundling')} />
                                        {bundleDiscount > 0 && (
                                            <span className="rounded-md border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                                                {t('bundling.dashboard.catalog.savePercent', {
                                                    percent: savePercent,
                                                    defaultValue: `Hemat ${savePercent}%`,
                                                })}
                                            </span>
                                        )}
                                        {bundle.batch && (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-[#DCE3EC] bg-[#FAF8F4] px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                                                <Calendar className="h-3.5 w-3.5 text-[#1976D3]" />
                                                {bundle.batch}
                                            </span>
                                        )}
                                    </div>
                                    <h3 className="font-literata text-lg font-bold leading-snug text-[#12344E]">{bundle.title}</h3>
                                    <p className="flex items-center gap-1.5 text-xs text-[#475569] sm:text-sm">
                                        <Package className="h-4 w-4 text-[#1976D3]" />
                                        {t('bundling.dashboard.catalog.programsCount', {
                                            count: bundle.bundle_items_count,
                                            defaultValue: `${bundle.bundle_items_count} Program`,
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Programs & Benefits Tabs */}
                        <Tabs defaultValue="programs" className="w-full">
                            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-1">
                                <TabsTrigger value="programs" className="gap-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white sm:text-sm">
                                    <Package className="h-4 w-4" />
                                    <span className="hidden sm:inline">
                                        {t('bundling.checkout.includedPrograms', { count: bundle.bundle_items_count, defaultValue: 'Program Included' })}
                                    </span>
                                    <span className="sm:hidden">
                                        {t('bundling.dashboard.catalog.programsCount', { count: bundle.bundle_items_count, defaultValue: 'Program' })}
                                    </span>
                                </TabsTrigger>
                                <TabsTrigger value="benefits" className="gap-2 rounded-lg text-xs font-semibold data-[state=active]:bg-white sm:text-sm">
                                    <BadgeCheck className="h-4 w-4" />
                                    <span>{t('bundling.checkout.packageBenefits', 'Keuntungan')}</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="programs" className="mt-4">
                                <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-6">
                                    <div className="mb-4">
                                        <h2 className="font-literata text-xl font-bold text-[#12344E]">
                                            {t('bundling.checkout.programsInBundleTitle', 'Program dalam Paket')}
                                        </h2>
                                        <p className="mt-1 text-xs text-[#5B6B7F] sm:text-sm">
                                            {t('bundling.checkout.programsInBundleSubtitle', {
                                                count: bundle.bundle_items_count,
                                                defaultValue: `${bundle.bundle_items_count} program pembelajaran yang bisa kamu akses`,
                                            })}
                                        </p>
                                    </div>

                                    <div className="space-y-3">
                                        {bundle.bundle_items.map((item, idx) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-3.5 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5"
                                            >
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#12344E] text-sm font-bold text-white">
                                                    {idx + 1}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-[#12344E] sm:text-base">{item.bundleable.title}</p>
                                                    <p className="mt-0.5 text-xs text-[#5B6B7F]">
                                                        {item.bundleable_type.includes('Course')
                                                            ? t('home:latest.badges.course', 'Kelas Online')
                                                            : item.bundleable_type.includes('Bootcamp')
                                                              ? t('home:latest.badges.bootcamp', 'Bootcamp')
                                                              : t('home:latest.badges.webinar', 'Webinar')}
                                                    </p>
                                                </div>
                                                <div className="shrink-0 text-sm font-semibold text-[#162230] tabular-nums">
                                                    {item.price === 0 ? (
                                                        <span className="text-[#15803D]">{t('bundling.dashboard.catalog.free', 'Gratis')}</span>
                                                    ) : (
                                                        rupiahFormatter.format(item.price)
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="benefits" className="mt-4">
                                <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-6">
                                    <div className="mb-4">
                                        <h2 className="font-literata text-xl font-bold text-[#12344E]">
                                            {t('bundling.checkout.packageBenefits', 'Keuntungan Paket Bundling')}
                                        </h2>
                                        <p className="mt-1 text-xs text-[#5B6B7F] sm:text-sm">
                                            {t('bundling.checkout.packageBenefitsDesc', 'Benefit yang akan kamu dapatkan dengan membeli paket bundling')}
                                        </p>
                                    </div>

                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {[
                                            t('bundling.checkout.benefitSave', {
                                                percent: savePercent,
                                                defaultValue: `Hemat ${savePercent}% dari harga normal`,
                                            }),
                                            t('bundling.checkout.benefitAccess', {
                                                count: bundle.bundle_items_count,
                                                defaultValue: `Akses ke ${bundle.bundle_items_count} program pembelajaran sekaligus`,
                                            }),
                                            t('bundling.checkout.benefitCertificates', 'Sertifikat untuk semua program yang diselesaikan'),
                                            t('bundling.checkout.benefitLifetime', 'Akses selamanya ke semua materi pembelajaran'),
                                            t('bundling.checkout.benefitUpdates', 'Update materi gratis selamanya'),
                                            t('bundling.checkout.benefitSupport', 'Prioritas support dari tim instruktur'),
                                        ].map((benefit, idx) => (
                                            <div key={idx} className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#15803D] text-white">
                                                    <Check className="h-3.5 w-3.5" />
                                                </div>
                                                <p className="text-sm leading-relaxed text-[#162230]">{benefit}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {/* Participant Form Card */}
                        {!isLoggedIn && (
                            <form className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm" onSubmit={submit}>
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                    <div>
                                        <h2 className="font-literata text-lg font-bold text-[#12344E]">
                                            {t('webinar.register.participantDataTitle', 'Data Peserta')}
                                        </h2>
                                        <p className="text-xs text-[#475569]">
                                            {t('webinar.register.participantDataDesc', 'Digunakan untuk pembuatan sertifikat & akses grup kelas.')}
                                        </p>
                                    </div>
                                    <span className="text-xs text-[#5B6B7F]">
                                        <span className="font-semibold text-[#B91C1C]">*</span>{' '}
                                        {t('webinar.register.requiredLegend', 'Wajib diisi')}
                                    </span>
                                </div>

                                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="email" className="text-sm font-semibold text-[#162230]">
                                            {t('bundling.checkout.emailLabel', 'Email')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <div className="flex gap-2">
                                            <div className="relative flex-1">
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    required
                                                    tabIndex={1}
                                                    autoComplete="email"
                                                    value={data.email}
                                                    onChange={(e) => setData('email', e.target.value)}
                                                    disabled={processing}
                                                    placeholder="email@example.com"
                                                    className="pr-10"
                                                />
                                                {checkingEmail && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                        <LoaderCircle className="h-4 w-4 animate-spin text-[#5B6B7F]" />
                                                    </div>
                                                )}
                                                {!checkingEmail && emailExists && (
                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                        <Check className="h-5 w-5 text-[#15803D]" />
                                                    </div>
                                                )}
                                            </div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            onClick={async () => {
                                                                if (!data.email || !data.email.includes('@')) {
                                                                    toast.error(t('bundling.checkout.emailValidRequired', 'Masukkan email yang valid'));
                                                                    return;
                                                                }

                                                                setCheckingEmail(true);
                                                                try {
                                                                    const response = await axios.post('/api/check-email', {
                                                                        email: data.email,
                                                                    });

                                                                    if (response.data.exists) {
                                                                        setEmailExists(true);
                                                                        setData('name', response.data.name || '');
                                                                        setData('phone_number', response.data.phone_number || '');
                                                                        setData('instance', response.data.instance || '');
                                                                        setData('city', response.data.city || '');
                                                                        toast.success(t('bundling.checkout.emailFound', 'Email ditemukan!'));
                                                                    } else {
                                                                        setEmailExists(false);
                                                                        toast.info(t('bundling.checkout.emailNotRegistered', 'Email tidak terdaftar'));
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error checking email:', error);
                                                                    setEmailExists(false);
                                                                    toast.error(t('bundling.checkout.checkEmailFailed', 'Gagal mengecek email'));
                                                                } finally {
                                                                    setCheckingEmail(false);
                                                                }
                                                            }}
                                                            disabled={checkingEmail || !data.email}
                                                            className="h-11 shrink-0 gap-1.5 px-3"
                                                        >
                                                            <RefreshCw className="h-4 w-4" />
                                                            <span className="hidden sm:inline">
                                                                {t('webinar.register.btnCheckEmail', 'Cek Email')}
                                                            </span>
                                                        </Button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {t(
                                                            'webinar.register.checkEmailTooltip',
                                                            'Periksa apakah email sudah terdaftar untuk mengisi data otomatis',
                                                        )}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        {emailExists && (
                                            <p className="text-xs font-medium text-[#15803D]">
                                                {t('bundling.checkout.emailFound', 'Email ditemukan, data terisi otomatis')}
                                            </p>
                                        )}
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-sm font-semibold text-[#162230]">
                                            {t('bundling.checkout.nameLabel', 'Nama Lengkap')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="name"
                                            type="text"
                                            required
                                            tabIndex={2}
                                            autoComplete="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            disabled={processing || emailExists}
                                            placeholder={t('bundling.checkout.namePlaceholder', 'Nama lengkap Anda')}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone_number" className="text-sm font-semibold text-[#162230]">
                                            {t('bundling.checkout.phoneLabel', 'No. Telepon / WhatsApp')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="phone_number"
                                            type="tel"
                                            required
                                            tabIndex={3}
                                            autoComplete="tel"
                                            value={data.phone_number}
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                            disabled={processing}
                                            placeholder={t('bundling.checkout.phonePlaceholder', '08xxxxxxxxxx')}
                                        />
                                        {!emailExists && (
                                            <p className="text-xs leading-relaxed text-[#475569]">
                                                {t('bundling.checkout.phoneNotice', 'Nomor telepon akan digunakan sebagai password akun Anda')}
                                            </p>
                                        )}
                                        {emailExists && (
                                            <p className="text-xs font-medium text-[#1976D3]">
                                                {t('bundling.checkout.phoneMatchNotice', 'Pastikan nomor telepon sesuai dengan yang terdaftar')}
                                            </p>
                                        )}
                                        <InputError message={errors.phone_number} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="instance" className="text-sm font-semibold text-[#162230]">
                                            {t('bundling.checkout.instanceLabel', 'Instansi / Perusahaan')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="instance"
                                            type="text"
                                            tabIndex={4}
                                            autoComplete="organization"
                                            value={data.instance}
                                            onChange={(e) => setData('instance', e.target.value)}
                                            disabled={processing}
                                            placeholder={t('bundling.checkout.instancePlaceholder', 'Instansi atau perusahaan Anda')}
                                            required
                                        />
                                        <InputError message={errors.instance} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="city" className="text-sm font-semibold text-[#162230]">
                                            {t('bundling.checkout.cityLabel', 'Kota Domisili')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            tabIndex={5}
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            disabled={processing}
                                            placeholder={t('bundling.checkout.cityPlaceholder', 'Kota domisili Anda')}
                                            required
                                        />
                                        <InputError message={errors.city} />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Right Column: Sticky Payment Summary */}
                    <div className={!pendingInvoice ? 'lg:sticky lg:top-24 lg:col-span-5' : 'lg:col-span-12'}>
                        {hasAccess && (!activeInstallment || activeInstallment.is_fully_paid) ? (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-[#BBF7D0] bg-white p-6 text-center shadow-sm">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
                                    <BadgeCheck className="h-7 w-7 text-[#15803D]" />
                                </div>
                                <div>
                                    <h2 className="font-literata mb-1.5 text-xl font-bold text-[#12344E]">
                                        {t('bundling.checkout.alreadyHaveAccessTitle', 'Sudah Terdaftar')}
                                    </h2>
                                    <p className="text-sm text-[#475569]">
                                        {t(
                                            'bundling.checkout.alreadyHaveAccessDesc',
                                            'Anda sudah memiliki akses ke paket bundling ini. Lanjutkan belajar untuk menyelesaikan materi.',
                                        )}
                                    </p>
                                </div>
                                <Button asChild size="lg" className="h-11 w-full bg-[#15803D] text-white hover:bg-[#166534]">
                                    <Link href={route('profile.index')}>
                                        <Play className="mr-2 h-4 w-4" />
                                        {t('bundling.checkout.btnGoToProfile', 'Lihat Dashboard')}
                                    </Link>
                                </Button>
                            </div>
                        ) : pendingInvoice ? (
                            <PaymentStatusCard
                                pendingInvoice={pendingInvoice}
                                expiryInfo={formatExpiryTime(pendingInvoice.expires_at)}
                                cancellingInvoice={cancellingInvoice}
                                onCopy={handleCopyText}
                                onCancel={async () => {
                                    if (
                                        confirm(
                                            t(
                                                'bundling.checkout.confirmCancel',
                                                'Apakah Anda yakin ingin membatalkan transaksi ini dan membuat pesanan baru?',
                                            ),
                                        )
                                    ) {
                                        setCancellingInvoice(true);
                                        try {
                                            await axios.post(route('invoice.cancel', pendingInvoice.id));
                                            toast.success(t('bundling.checkout.cancelSuccess', 'Pesanan berhasil dibatalkan.'));
                                            window.location.reload();
                                        } catch (err: any) {
                                            toast.error(err.response?.data?.message || t('bundling.checkout.cancelFailed', 'Gagal membatalkan pesanan.'));
                                            setCancellingInvoice(false);
                                        }
                                    }
                                }}
                            />
                        ) : (
                            <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                                <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                    <h2 className="font-literata text-lg font-bold text-[#12344E]">
                                        {t('bundling.checkout.paymentDetailTitle', 'Ringkasan Pembayaran')}
                                    </h2>
                                </div>

                                <form onSubmit={handleCheckout} className="space-y-5 p-5 sm:p-6">
                                    {(installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid) ? (
                                        <Tabs
                                            value={paymentTab}
                                            onValueChange={(val) => {
                                                if (val === 'full' && activeInstallment && !activeInstallment.is_fully_paid) {
                                                    toast.error(
                                                        t(
                                                            'bundling.checkout.errors.fullPaymentDisabled',
                                                            'Anda memiliki cicilan aktif. Pembayaran penuh dinonaktifkan.',
                                                        ),
                                                    );
                                                    return;
                                                }
                                                if (val === 'installment' && isAnyTermOverdue && !activeInstallment) {
                                                    toast.error(
                                                        t(
                                                            'bundling.checkout.errors.installmentOverdue',
                                                            'Batas waktu pembayaran cicilan telah terlewat.',
                                                        ),
                                                    );
                                                    return;
                                                }
                                                setPaymentTab(val as 'full' | 'installment');
                                            }}
                                            className="w-full space-y-4"
                                        >
                                            <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-1">
                                                <TabsTrigger
                                                    value="full"
                                                    disabled={!!activeInstallment && !activeInstallment.is_fully_paid}
                                                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-white sm:text-sm"
                                                >
                                                    {t('bundling.checkout.tabFullPayment', 'Bayar Penuh')}
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="installment"
                                                    disabled={isAnyTermOverdue && !activeInstallment}
                                                    className="rounded-lg text-xs font-semibold data-[state=active]:bg-white sm:text-sm"
                                                >
                                                    {t('bundling.checkout.tabInstallment', 'Cicilan')} (
                                                    {activeInstallment && !activeInstallment.is_fully_paid
                                                        ? activeInstallment.total_terms || activeInstallment.terms?.length
                                                        : installmentTerms.length}
                                                    x)
                                                </TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="full" className="m-0 space-y-5">
                                                {/* Collapsible Voucher / Referral */}
                                                <Collapsible open={promoOpen || promoApplied} onOpenChange={setPromoOpen}>
                                                    <CollapsibleTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="flex min-h-11 w-full items-center justify-between rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] px-4 py-2.5 text-left text-sm font-semibold text-[#12344E] transition-colors hover:border-[#93C5FD]"
                                                        >
                                                            <span className="flex items-center gap-2">
                                                                <Tag className="h-4 w-4 text-[#1976D3]" />
                                                                <span>{t('webinar.register.havePromoCode', 'Punya kode voucher atau referral?')}</span>
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
                                                                    {t('bundling.checkout.codeType', 'Jenis Kode')}
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
                                                                    }}
                                                                    className="flex gap-5 pt-1"
                                                                >
                                                                    <div className="flex items-center space-x-2">
                                                                        <RadioGroupItem value="voucher" id="bund-code-voucher" />
                                                                        <Label htmlFor="bund-code-voucher" className="cursor-pointer text-sm text-[#162230]">
                                                                            {t('bundling.checkout.voucher', 'Voucher')}
                                                                        </Label>
                                                                    </div>
                                                                    <div className="flex items-center space-x-2">
                                                                        <RadioGroupItem value="referral" id="bund-code-referral" />
                                                                        <Label htmlFor="bund-code-referral" className="cursor-pointer text-sm text-[#162230]">
                                                                            {t('bundling.checkout.referral', 'Referral')}
                                                                        </Label>
                                                                    </div>
                                                                </RadioGroup>
                                                            </div>

                                                            <div className="space-y-1.5">
                                                                <Label htmlFor="promo-code" className="text-xs font-semibold text-[#162230]">
                                                                    {codeType === 'voucher'
                                                                        ? t('bundling.checkout.voucherCode', 'Kode Voucher / Promo')
                                                                        : t('bundling.checkout.referralCode', 'Kode Referral')}
                                                                </Label>
                                                                <div className="flex gap-2">
                                                                    <div className="relative flex-1">
                                                                        <Input
                                                                            id="promo-code"
                                                                            type="text"
                                                                            placeholder={
                                                                                codeType === 'voucher'
                                                                                    ? t('bundling.checkout.enterVoucherCode', 'Masukkan kode promo')
                                                                                    : t('bundling.checkout.enterReferralCode', 'Masukkan kode referral')
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
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={async () => {
                                                                            if (!promoCode.trim()) {
                                                                                toast.error(
                                                                                    t('bundling.checkout.errors.enterCodeRequired', {
                                                                                        type: codeType === 'voucher' ? 'promo' : 'referral',
                                                                                        defaultValue: `Masukkan kode ${codeType === 'voucher' ? 'promo' : 'referral'} terlebih dahulu`,
                                                                                    }),
                                                                                );
                                                                                return;
                                                                            }
                                                                            if (codeType === 'voucher') await validatePromoCode();
                                                                            else await validateReferralCode();
                                                                        }}
                                                                        disabled={promoLoading || referralLoading || !promoCode.trim()}
                                                                        className="h-11 shrink-0 gap-1.5 px-3"
                                                                    >
                                                                        <RefreshCw className="h-4 w-4" />
                                                                        <span className="text-xs font-semibold">
                                                                            {t('webinar.register.btnVerifyCode', 'Cek')}
                                                                        </span>
                                                                    </Button>
                                                                </div>

                                                                {codeType === 'voucher' && promoError && (
                                                                    <p className="text-xs font-medium text-[#B91C1C]">{promoError}</p>
                                                                )}
                                                                {codeType === 'voucher' && discountData?.valid && (
                                                                    <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                                                                        <div className="flex items-center gap-2">
                                                                            <Check className="h-4 w-4 text-[#15803D]" />
                                                                            <p className="text-xs font-semibold text-[#15803D]">
                                                                                {t('bundling.checkout.voucherSuccess', {
                                                                                    code: discountData.discount_code.code,
                                                                                    defaultValue: `Promo "${discountData.discount_code.code}" diterapkan!`,
                                                                                })}
                                                                            </p>
                                                                        </div>
                                                                        <p className="mt-1 text-xs text-[#166534]">
                                                                            {discountData.discount_code.name} —{' '}
                                                                            {t('bundling.detail.register.saveLabel', 'Hemat')}{' '}
                                                                            {discountData.discount_code.formatted_value}
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
                                                                            <p className="text-xs font-semibold text-[#15803D]">
                                                                                {t('bundling.checkout.referralSuccess', 'Kode Referral Valid!')}
                                                                            </p>
                                                                        </div>
                                                                        <p className="mt-1 text-xs text-[#166534]">
                                                                            {t('bundling.checkout.referralReferredBy', {
                                                                                name: referralData.referrer?.name,
                                                                                defaultValue: `Pembelian Anda dirujuk oleh ${referralData.referrer?.name}. Reward poin akan masuk setelah pembayaran sukses.`,
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>

                                                {/* Price Breakdown */}
                                                <div className="space-y-2.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#475569]">{t('bundling.checkout.bundlePrice', 'Harga Paket')}</span>
                                                        <span className="font-semibold text-[#162230] tabular-nums">
                                                            {rupiahFormatter.format(bundle.price)}
                                                        </span>
                                                    </div>

                                                    {discountData?.valid && (
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="flex items-center gap-1 text-[#475569]">
                                                                <Gift className="h-3.5 w-3.5 text-[#15803D]" />
                                                                {t('bundling.checkout.promoDiscount', {
                                                                    code: discountData.discount_code.code,
                                                                    defaultValue: `Promo (${discountData.discount_code.code})`,
                                                                })}
                                                            </span>
                                                            <span className="font-semibold text-[#15803D] tabular-nums">
                                                                -{rupiahFormatter.format(discountData.discount_amount)}
                                                            </span>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#475569]">
                                                            {t('bundling.checkout.transactionFee', 'Biaya Transaksi')}
                                                        </span>
                                                        <span className="font-medium text-[#162230] tabular-nums">
                                                            {rupiahFormatter.format(adminFee)}
                                                        </span>
                                                    </div>

                                                    <Separator className="bg-[#DCE3EC]" />

                                                    <div className="flex items-center justify-between pt-1">
                                                        <span className="font-semibold text-[#12344E]">
                                                            {t('bundling.checkout.totalPayment', 'Total Pembayaran')}
                                                        </span>
                                                        <span className="font-literata text-2xl font-bold text-[#12344E] tabular-nums">
                                                            {rupiahFormatter.format(totalPrice)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Terms Checkbox */}
                                                <div className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                                    <Checkbox
                                                        id="terms"
                                                        checked={termsAccepted}
                                                        onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                                        className="mt-0.5"
                                                    />
                                                    <Label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-[#475569] sm:text-sm">
                                                        {t('bundling.checkout.agreeTerms', 'Saya menyetujui')}{' '}
                                                        <a
                                                            href="/terms-and-conditions"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-semibold text-[#1976D3] hover:underline"
                                                        >
                                                            {t('bundling.checkout.termsAndConditions', 'syarat dan ketentuan')}
                                                        </a>{' '}
                                                        {t('bundling.checkout.termsApplicable', 'yang berlaku')}
                                                    </Label>
                                                </div>

                                                <div className="space-y-2">
                                                    <Button
                                                        type="submit"
                                                        size="lg"
                                                        disabled={!termsAccepted || loading}
                                                        className="h-12 w-full text-base font-semibold"
                                                    >
                                                        {loading ? (
                                                            <>
                                                                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                                {t('bundling.checkout.processing', 'Memproses...')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <CreditCard className="mr-2 h-5 w-5" />
                                                                {t('bundling.checkout.btnPayNow', 'Lanjutkan Pembayaran')}
                                                            </>
                                                        )}
                                                    </Button>

                                                    {!termsAccepted && !loading && (
                                                        <p className="text-center text-xs text-[#5B6B7F]">
                                                            {t(
                                                                'webinar.register.disabledTermsHint',
                                                                'Centang persetujuan syarat dan ketentuan di atas untuk mengaktifkan tombol bayar.',
                                                            )}
                                                        </p>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-center gap-1.5 text-xs text-[#5B6B7F]">
                                                    <Shield className="h-3.5 w-3.5 text-[#15803D]" />
                                                    <span>{t('bundling.checkout.securityDesc', 'Transaksi Anda dilindungi dengan enkripsi SSL')}</span>
                                                </div>
                                            </TabsContent>

                                            <TabsContent value="installment" className="m-0 space-y-4">
                                                <InstallmentOptions
                                                    productType="bundle"
                                                    productId={bundle.id}
                                                    productPrice={bundle.price}
                                                    terms={installmentTerms}
                                                    activeInstallment={activeInstallment}
                                                    termsAccepted={termsAccepted}
                                                    onTermsAcceptedChange={setTermsAccepted}
                                                    onBeforePay={async () => {
                                                        if (!activeInstallment && !termsAccepted) {
                                                            toast.error(
                                                                t(
                                                                    'bundling.checkout.errors.termsRequired',
                                                                    'Anda harus menyetujui syarat dan ketentuan!',
                                                                ),
                                                            );
                                                            return false;
                                                        }
                                                        return await ensureAuth();
                                                    }}
                                                />
                                            </TabsContent>
                                        </Tabs>
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
                                                            <span>{t('webinar.register.havePromoCode', 'Punya kode voucher atau referral?')}</span>
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
                                                                {t('bundling.checkout.codeType', 'Jenis Kode')}
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
                                                                }}
                                                                className="flex gap-5 pt-1"
                                                            >
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="voucher" id="bund-code-voucher" />
                                                                    <Label htmlFor="bund-code-voucher" className="cursor-pointer text-sm text-[#162230]">
                                                                        {t('bundling.checkout.voucher', 'Voucher')}
                                                                    </Label>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <RadioGroupItem value="referral" id="bund-code-referral" />
                                                                    <Label htmlFor="bund-code-referral" className="cursor-pointer text-sm text-[#162230]">
                                                                        {t('bundling.checkout.referral', 'Referral')}
                                                                    </Label>
                                                                </div>
                                                            </RadioGroup>
                                                        </div>

                                                        <div className="space-y-1.5">
                                                            <Label htmlFor="promo-code" className="text-xs font-semibold text-[#162230]">
                                                                {codeType === 'voucher'
                                                                    ? t('bundling.checkout.voucherCode', 'Kode Voucher / Promo')
                                                                    : t('bundling.checkout.referralCode', 'Kode Referral')}
                                                            </Label>
                                                            <div className="flex gap-2">
                                                                <div className="relative flex-1">
                                                                    <Input
                                                                        id="promo-code"
                                                                        type="text"
                                                                        placeholder={
                                                                            codeType === 'voucher'
                                                                                ? t('bundling.checkout.enterVoucherCode', 'Masukkan kode promo')
                                                                                : t('bundling.checkout.enterReferralCode', 'Masukkan kode referral')
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
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={async () => {
                                                                        if (!promoCode.trim()) {
                                                                            toast.error(
                                                                                t('bundling.checkout.errors.enterCodeRequired', {
                                                                                    type: codeType === 'voucher' ? 'promo' : 'referral',
                                                                                    defaultValue: `Masukkan kode ${codeType === 'voucher' ? 'promo' : 'referral'} terlebih dahulu`,
                                                                                }),
                                                                            );
                                                                            return;
                                                                        }
                                                                        if (codeType === 'voucher') await validatePromoCode();
                                                                        else await validateReferralCode();
                                                                    }}
                                                                    disabled={promoLoading || referralLoading || !promoCode.trim()}
                                                                    className="h-11 shrink-0 gap-1.5 px-3"
                                                                >
                                                                    <RefreshCw className="h-4 w-4" />
                                                                    <span className="text-xs font-semibold">
                                                                        {t('webinar.register.btnVerifyCode', 'Cek')}
                                                                    </span>
                                                                </Button>
                                                            </div>

                                                            {codeType === 'voucher' && promoError && (
                                                                <p className="text-xs font-medium text-[#B91C1C]">{promoError}</p>
                                                            )}
                                                            {codeType === 'voucher' && discountData?.valid && (
                                                                <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Check className="h-4 w-4 text-[#15803D]" />
                                                                        <p className="text-xs font-semibold text-[#15803D]">
                                                                            {t('bundling.checkout.voucherSuccess', {
                                                                                code: discountData.discount_code.code,
                                                                                defaultValue: `Promo "${discountData.discount_code.code}" diterapkan!`,
                                                                            })}
                                                                        </p>
                                                                    </div>
                                                                    <p className="mt-1 text-xs text-[#166534]">{discountData.discount_code.name}</p>
                                                                </div>
                                                            )}

                                                            {codeType === 'referral' && referralError && (
                                                                <p className="text-xs font-medium text-[#B91C1C]">{referralError}</p>
                                                            )}
                                                            {codeType === 'referral' && referralData?.valid && (
                                                                <div className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] p-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <Check className="h-4 w-4 text-[#15803D]" />
                                                                        <p className="text-xs font-semibold text-[#15803D]">
                                                                            {t('bundling.checkout.referralSuccess', 'Kode Referral Valid!')}
                                                                        </p>
                                                                    </div>
                                                                    <p className="mt-1 text-xs text-[#166534]">
                                                                        {t('bundling.checkout.referralReferredBy', {
                                                                            name: referralData.referrer?.name,
                                                                            defaultValue: `Pembelian Anda dirujuk oleh ${referralData.referrer?.name}. Reward poin akan masuk setelah pembayaran sukses.`,
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CollapsibleContent>
                                            </Collapsible>

                                            {/* Price Breakdown */}
                                            <div className="space-y-2.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                                {bundle.strikethrough_price > 0 && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#475569]">{t('bundling.checkout.normalPrice', 'Harga Normal')}</span>
                                                        <span className="text-[#5B6B7F] line-through tabular-nums">
                                                            {rupiahFormatter.format(bundle.strikethrough_price)}
                                                        </span>
                                                    </div>
                                                )}

                                                {bundleDiscount > 0 && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#475569]">{t('bundling.checkout.bundleDiscount', 'Diskon Bundle')}</span>
                                                        <span className="font-semibold text-[#15803D] tabular-nums">
                                                            -{rupiahFormatter.format(bundleDiscount)}
                                                        </span>
                                                    </div>
                                                )}

                                                {discountData?.valid && (
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#475569]">
                                                            {t('bundling.checkout.promoDiscount', {
                                                                code: discountData.discount_code.code,
                                                                defaultValue: `Diskon Promo (${discountData.discount_code.code})`,
                                                            })}
                                                        </span>
                                                        <span className="font-semibold text-[#15803D] tabular-nums">
                                                            -{rupiahFormatter.format(discountData.discount_amount)}
                                                        </span>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[#475569]">{t('bundling.checkout.bundlePrice', 'Harga Paket')}</span>
                                                    <span className="font-semibold text-[#162230] tabular-nums">
                                                        {rupiahFormatter.format(bundle.price)}
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[#475569]">{t('bundling.checkout.transactionFee', 'Biaya Transaksi')}</span>
                                                    <span className="font-medium text-[#162230] tabular-nums">
                                                        {rupiahFormatter.format(adminFee)}
                                                    </span>
                                                </div>

                                                <Separator className="bg-[#DCE3EC]" />

                                                <div className="flex items-center justify-between pt-1">
                                                    <span className="font-semibold text-[#12344E]">
                                                        {t('bundling.checkout.totalPayment', 'Total Pembayaran')}
                                                    </span>
                                                    <span className="font-literata text-2xl font-bold text-[#12344E] tabular-nums">
                                                        {rupiahFormatter.format(totalPrice)}
                                                    </span>
                                                </div>
                                            </div>

                                            {referralInfo.hasActive && (
                                                <div className="rounded-xl border border-[#BFDBFE] bg-[#EAF3FC] p-3.5 text-xs text-[#12344E]">
                                                    <p className="font-semibold">
                                                        {t('bundling.checkout.referralActiveNotice', {
                                                            code: referralInfo.code,
                                                            defaultValue: `Menggunakan kode referral: ${referralInfo.code}`,
                                                        })}
                                                    </p>
                                                    <p className="mt-0.5 text-[#475569]">
                                                        {t('bundling.checkout.referralHelpFriend', 'Anda membantu teman Anda mendapatkan komisi.')}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Terms Checkbox */}
                                            <div className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                                <Checkbox
                                                    id="terms"
                                                    checked={termsAccepted}
                                                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                                    className="mt-0.5"
                                                />
                                                <Label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-[#475569] sm:text-sm">
                                                    {t('bundling.checkout.agreeTerms', 'Saya menyetujui')}{' '}
                                                    <a
                                                        href="/terms-and-conditions"
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-semibold text-[#1976D3] hover:underline"
                                                    >
                                                        {t('bundling.checkout.termsAndConditions', 'syarat dan ketentuan')}
                                                    </a>{' '}
                                                    {t('bundling.checkout.termsApplicable', 'yang berlaku')}
                                                </Label>
                                            </div>

                                            <div className="space-y-2">
                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    disabled={!termsAccepted || loading}
                                                    className="h-12 w-full text-base font-semibold"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                                            {t('bundling.checkout.processing', 'Memproses...')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CreditCard className="mr-2 h-5 w-5" />
                                                            {t('bundling.checkout.btnPayNow', 'Lanjutkan Pembayaran')}
                                                        </>
                                                    )}
                                                </Button>

                                                {!termsAccepted && !loading && (
                                                    <p className="text-center text-xs text-[#5B6B7F]">
                                                        {t(
                                                            'webinar.register.disabledTermsHint',
                                                            'Centang persetujuan syarat dan ketentuan di atas untuk mengaktifkan tombol bayar.',
                                                        )}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="flex items-center justify-center gap-1.5 text-xs text-[#5B6B7F]">
                                                <Shield className="h-3.5 w-3.5 text-[#15803D]" />
                                                <span>{t('bundling.checkout.securityDesc', 'Transaksi Anda dilindungi dengan enkripsi SSL')}</span>
                                            </div>
                                        </>
                                    )}
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <Toaster position="top-center" richColors />
        </div>
    );
}
