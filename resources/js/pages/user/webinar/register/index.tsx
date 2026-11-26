import { CheckoutHeader } from '@/components/checkout-header';
import InputError from '@/components/input-error';
import { PaymentStatusCard } from '@/components/payment-status-card';
import { ProgramBadge } from '@/components/program-badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Toaster } from '@/components/ui/sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatIndonesianDate, resolveStorageUrl } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BadgeCheck, Calendar, Check, ChevronDown, LoaderCircle, Lock, RefreshCw, Shield, Tag, User, X } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import InstallmentOptions, { InstallmentTermOption, ActiveInstallmentData } from '@/components/installment-options';
import { useTranslation } from 'react-i18next';

interface Webinar {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    slug: string;
    description?: string | null;
    benefits?: string | null;
    group_url?: string | null;
    requirement_1?: string | null;
    requirement_2?: string | null;
    requirement_3?: string | null;
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

type RegisterForm = {
    name: string;
    email: string;
    phone_number: string;
    instance: string;
    city: string;
    password: string;
    password_confirmation: string;
};

export default function RegisterWebinar({
    webinar,
    hasAccess,
    activeInstallment: initialActiveInstallment = null,
    pendingInvoice,
    transactionDetail,
    referralInfo,
    installmentTerms = [],
}: {
    webinar: Webinar;
    hasAccess: boolean;
    activeInstallment?: ActiveInstallmentData | null;
    pendingInvoice?: PendingInvoice | null;
    transactionDetail?: TransactionDetail | null;
    referralInfo: ReferralInfo;
    installmentTerms?: InstallmentTermOption[];
}) {
    const { auth } = usePage<SharedData>().props;
    const { t, i18n } = useTranslation('user');
    const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number && auth.user?.instance && auth.user?.city;

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

    const [showFreeForm, setShowFreeForm] = useState(false);
    const [freeFormData, setFreeFormData] = useState<Record<string, File | null>>({
        requirement_1_proof: null,
        requirement_2_proof: null,
        requirement_3_proof: null,
    });
    const [fileErrors, setFileErrors] = useState<Record<string, boolean>>({
        requirement_1_proof: false,
        requirement_2_proof: false,
        requirement_3_proof: false,
    });

    const [emailExists, setEmailExists] = useState(false);
    const [checkingEmail, setCheckingEmail] = useState(false);

    const isFree = webinar.price === 0;
    const basePrice = webinar.price;
    const discountAmount = discountData?.valid ? discountData.discount_amount : 0;
    const maxPointsAllowed = basePrice - discountAmount;

    const finalWebinarPrice = basePrice - discountAmount - (pointsChecked ? pointsToUse : 0);
    const adminFee = isFree ? 0 : 5000;
    const totalPrice = isFree ? 0 : finalWebinarPrice + adminFee;

    const { data, setData, post, processing, errors, reset } = useForm<Required<RegisterForm>>({
        name: '',
        email: '',
        phone_number: '',
        instance: '',
        city: '',
        password: '',
        password_confirmation: '',
    });

    // Auto-check email
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
                    webinar_id: webinar.id,
                });

                if (response.data.exists) {
                    setEmailExists(true);
                    setData('name', response.data.name || '');
                    setData('phone_number', response.data.phone_number || '');
                    setData('instance', response.data.instance || '');
                    setData('city', response.data.city || '');

                    if (response.data.active_installment) {
                        setActiveInstallment(response.data.active_installment);
                        setPaymentMode('installment');
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
    }, [data.email, webinar.id]);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    // Fetch point balance on mount
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
                email: !isLoggedIn ? data.email : undefined,
            });
            const dataRes = response.data;

            if (dataRes.valid) {
                setReferralData(dataRes);
                setReferralError('');
            } else {
                setReferralData(null);
                setReferralError(dataRes.message || t('webinar.register.errors.invalidReferral', 'Kode referral tidak valid'));
            }
        } catch (error: any) {
            setReferralData(null);
            setReferralError(error.response?.data?.message || t('webinar.register.errors.validateReferralFailed', 'Terjadi kesalahan saat memvalidasi kode referral'));
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
            const requestData: any = {
                code: promoCode,
                amount: webinar.price,
                product_type: 'webinar',
                product_id: webinar.id,
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
                setPromoError(response.data.message || t('webinar.register.errors.invalidPromo', 'Kode promo tidak valid'));
            }
        } catch (error: any) {
            setDiscountData(null);
            setPromoError(error.response?.data?.message || t('webinar.register.errors.validatePromoFailed', 'Terjadi kesalahan saat memvalidasi kode promo'));
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

        if (!isProfileComplete) {
            alert(t('webinar.register.incompleteProfileDesc', 'Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu untuk mendaftar webinar.'));
            window.location.href = route('profile.edit');
            return;
        }

        if (!freeFormData.requirement_1_proof || !freeFormData.requirement_2_proof || !freeFormData.requirement_3_proof) {
            alert(t('webinar.register.errors.uploadAllProofs', 'Harap upload semua bukti yang diperlukan!'));
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('type', 'webinar');
        formData.append('id', webinar.id);
        formData.append('requirement_1_proof', freeFormData.requirement_1_proof);
        formData.append('requirement_2_proof', freeFormData.requirement_2_proof);
        formData.append('requirement_3_proof', freeFormData.requirement_3_proof);

        router.post(route('enroll.free'), formData, {
            onError: (errors) => {
                alert(errors.message || t('webinar.register.errors.enrollFreeFailed', 'Gagal mendaftar webinar gratis.'));
            },
            onFinish: () => {
                setLoading(false);
            },
        });
    };

    const submitPayment = async (
        overrideDiscountData?: DiscountData | null,
        overrideCodeType?: 'voucher' | 'referral',
        overridePromoCode?: string,
        overrideReferralValid?: boolean,
        overridePointsChecked?: boolean,
        overridePointsToUse?: number,
    ): Promise<void> => {
        const activeDiscountData = overrideDiscountData !== undefined ? overrideDiscountData : discountData;
        const originalDiscountAmount = webinar.strikethrough_price > 0 ? webinar.strikethrough_price - webinar.price : 0;
        const promoDiscountAmount = activeDiscountData?.valid ? activeDiscountData.discount_amount : 0;
        
        const currentPointsChecked = overridePointsChecked !== undefined ? overridePointsChecked : pointsChecked;
        const currentPointsToUse = overridePointsToUse !== undefined ? overridePointsToUse : pointsToUse;
        const pointsDeduction = currentPointsChecked ? currentPointsToUse : 0;
        
        const activeFinalPrice = webinar.price - promoDiscountAmount - pointsDeduction;
        const activeTotalPrice = isFree ? 0 : activeFinalPrice + adminFee;

        const invoiceData: InvoiceData = {
            type: 'webinar',
            id: webinar.id,
            discount_amount: originalDiscountAmount + promoDiscountAmount,
            nett_amount: activeFinalPrice,
            total_amount: activeTotalPrice,
            points_redeemed: pointsDeduction,
        };

        const currentCodeType = overrideCodeType || codeType;
        const currentPromoCode = overridePromoCode || promoCode;
        const isReferralValid = overrideReferralValid !== undefined ? overrideReferralValid : referralData?.valid;

        if (activeDiscountData?.valid && currentCodeType === 'voucher') {
            invoiceData.discount_code_id = activeDiscountData.discount_code.id;
            invoiceData.discount_code_amount = activeDiscountData.discount_amount;
        }

        if (currentCodeType === 'referral' && isReferralValid) {
            invoiceData.referral_code = currentPromoCode;
        }

        const storedAffiliate = sessionStorage.getItem('affiliate_code');
        if (storedAffiliate) {
            (invoiceData as any).affiliate_code = storedAffiliate;
        }

        try {
            const res = await axios.post(route('invoice.store'), invoiceData);

            if (res.data && res.data.success) {
                if (res.data.payment_url) {
                    sessionStorage.removeItem('pendingCheckout');
                    window.location.href = res.data.payment_url;
                } else {
                    throw new Error('Payment URL not received');
                }
            } else {
                throw new Error(res.data?.message || t('webinar.register.errors.createInvoiceFailed', 'Gagal membuat invoice.'));
            }
        } catch (error) {
            console.error('Payment error:', error);
            throw error;
        }
    };

    const ensureAuth = async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!data.email || !data.name || !data.phone_number || !data.instance || !data.city) {
            toast.error(t('webinar.register.errors.fillAllFields', 'Lengkapi data terlebih dahulu'));
            return false;
        }

        try {
            if (emailExists) {
                const response = await axios.post(route('auto-login'), {
                    email: data.email,
                    phone_number: data.phone_number,
                    instance: data.instance,
                    city: data.city,
                });

                if (!response.data.success) {
                    throw new Error(response.data.message || t('webinar.register.errors.loginFailedPhone', 'Login gagal. Pastikan nomor telepon sesuai dengan yang terdaftar.'));
                }
            } else {
                const response = await axios.post(route('register'), {
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
                    throw new Error(t('webinar.register.errors.registerFailed', 'Registrasi gagal'));
                }
            }
            return true;
        } catch (error: any) {
            console.error('Login/Register error:', error);
            if (error.response?.status === 419) {
                toast.error(t('webinar.register.errors.sessionExpired', 'Sesi telah berakhir. Silakan muat ulang halaman.'));
            } else {
                toast.error(error.response?.data?.message || error.message || t('webinar.register.errors.loginRegisterFailed', 'Gagal login/registrasi'));
            }
            return false;
        }
    };

    const handleCheckout = async (e: React.FormEvent) => {
        e.preventDefault();

        // Jika belum login, lakukan registrasi/login dan langsung bayar
        if (!isLoggedIn) {
            if (!termsAccepted && !isFree) {
                toast.error(t('webinar.register.errors.agreeTermsRequired', 'Anda harus menyetujui syarat dan ketentuan!'));
                return;
            }

            setLoading(true);

            try {
                const authed = await ensureAuth();
                if (!authed) {
                    setLoading(false);
                    return;
                }

                if (isFree) {
                    setShowFreeForm(true);
                    setLoading(false);
                    return;
                }

                await submitPayment();
            } catch (error: any) {
                setLoading(false);
                return;
            }
            return;
        }

        // Validasi terms untuk pembayaran berbayar
        if (!termsAccepted && !isFree) {
            toast.error(t('webinar.register.errors.agreeTermsRequired', 'Anda harus menyetujui syarat dan ketentuan!'));
            setLoading(false);
            return;
        }

        if (!loading) {
            setLoading(true);
        }

        if (isFree) {
            setShowFreeForm(true);
            setLoading(false);
            return;
        }

        try {
            await submitPayment();
        } catch (error: any) {
            toast.error(error.message || t('webinar.register.errors.paymentFailed', 'Terjadi kesalahan saat proses pembayaran.'));
            setLoading(false);
        }
    };

    const validateFileSize = (file: File, maxSizeMB: number = 2): boolean => {
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        return file.size <= maxSizeBytes;
    };

    const handleFileChange = (fieldName: keyof typeof freeFormData, file: File | null) => {
        if (!file) {
            setFreeFormData((prev) => ({ ...prev, [fieldName]: null }));
            setFileErrors((prev) => ({ ...prev, [fieldName]: false }));
            return;
        }

        if (!validateFileSize(file, 2)) {
            setFileErrors((prev) => ({ ...prev, [fieldName]: true }));
            const input = document.querySelector(`input[data-field="${fieldName}"]`) as HTMLInputElement;
            if (input) input.value = '';
            toast.error(t('webinar.register.errors.fileTooLarge', 'Ukuran file terlalu besar. Maksimal 2MB.'));
            return;
        }

        if (!file.type.startsWith('image/')) {
            setFileErrors((prev) => ({ ...prev, [fieldName]: true }));
            const input = document.querySelector(`input[data-field="${fieldName}"]`) as HTMLInputElement;
            if (input) input.value = '';
            toast.error(t('webinar.register.errors.imageOnly', 'Hanya file gambar (JPG, PNG, GIF, dll) yang diperbolehkan.'));
            return;
        }

        setFreeFormData((prev) => ({ ...prev, [fieldName]: file }));
        setFileErrors((prev) => ({ ...prev, [fieldName]: false }));
        toast.success(t('webinar.register.uploadSuccess', 'File berhasil diunggah.'));
    };

    const formatExpiryTime = (expiresAt: string): { time: string; status: 'expired' | 'urgent' | 'normal' } => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diff = expiry.getTime() - now.getTime();

        if (diff <= 0) {
            return { time: t('webinar.register.expiredTime', 'Sudah kadaluarsa'), status: 'expired' };
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours < 1) {
            return { time: t('webinar.register.minutesLeft', { minutes, defaultValue: `${minutes} menit lagi` }), status: 'urgent' };
        }

        return {
            time: t('webinar.register.hoursMinutesLeft', { hours, minutes, defaultValue: `${hours} jam ${minutes} menit lagi` }),
            status: hours < 3 ? 'urgent' : 'normal',
        };
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            toast.success(t('webinar.register.copySuccess', 'Berhasil menyalin ke clipboard!'));
        });
    };

    // if (!isLoggedIn) {
    //     const currentUrl = window.location.href;
    //     const loginUrl = route('login', { redirect: currentUrl });

    //     return (
    //         <div className="min-h-screen bg-[url('/assets/images/bg-product.png')] bg-cover bg-center bg-no-repeat">
    //             <Head title="Login Required" />
    //             <section className="flex min-h-screen items-center justify-center px-4 py-12">
    //                 <div className="w-full max-w-md">
    //                     <div className="flex flex-col items-center justify-center space-y-6 rounded-2xl border bg-white/95 p-8 shadow-xl backdrop-blur-sm dark:bg-gray-800/95">
    //                         <div className="rounded-full bg-blue-100 p-6 dark:bg-blue-900/30">
    //                             <User size={48} className="text-blue-600 dark:text-blue-400" />
    //                         </div>
    //                         <div className="text-center">
    //                             <h2 className="mb-2 text-2xl font-bold">Login Diperlukan</h2>
    //                             <p className="text-gray-600 dark:text-gray-400">
    //                                 Silakan login terlebih dahulu untuk mendaftar webinar
    //                                 {referralInfo.hasActive && '. Kode referral Anda akan tetap tersimpan'}
    //                             </p>
    //                         </div>
    //                         <div className="flex w-full gap-3">
    //                             <Button asChild className="flex-1" size="lg">
    //                                 <a href={loginUrl}>Login</a>
    //                             </Button>
    //                             <Button asChild variant="outline" className="flex-1" size="lg">
    //                                 <Link href={route('register', referralInfo.code ? { ref: referralInfo.code } : {})}>Daftar</Link>
    //                             </Button>
    //                         </div>
    //                     </div>
    //                 </div>
    //             </section>
    //         </div>
    //     );
    // }

    if (isLoggedIn && !isProfileComplete) {
        return (
            <div className="min-h-screen bg-[#FAF8F4]">
                <Head title={t('webinar.register.headTitle', 'Daftar Webinar')} />
                <CheckoutHeader backHref={route('webinar.detail', webinar.slug)} />
                <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md rounded-2xl border border-[#DCE3EC] bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3EB]">
                            <User className="h-7 w-7 text-[#D95B16]" />
                        </div>
                        <h1 className="font-literata mb-2 text-2xl font-bold text-[#12344E]">
                            {t('webinar.register.incompleteProfileTitle', 'Profil Belum Lengkap')}
                        </h1>
                        <p className="mb-6 text-sm leading-relaxed text-[#475569]">
                            {t(
                                'webinar.register.incompleteProfileDesc',
                                'Profil Anda belum lengkap! Harap lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu untuk mendaftar webinar.',
                            )}
                        </p>
                        <Button asChild className="h-11 w-full font-semibold" size="lg">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>
                                {t('webinar.register.btnCompleteProfile', 'Lengkapi Profil')}
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
            <Head title={t('webinar.register.headTitle', 'Daftar Webinar')} />
            <CheckoutHeader backHref={route('webinar.detail', webinar.slug)} />

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="mb-6">
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#5B6B7F] sm:text-sm">
                        <Link href="/webinar" className="transition-colors hover:text-[#1976D3]">
                            Webinar
                        </Link>
                        <span>/</span>
                        <Link href={`/webinar/${webinar.slug}`} className="max-w-[240px] truncate transition-colors hover:text-[#1976D3] sm:max-w-md">
                            {webinar.title}
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-[#12344E]">{t('webinar.register.breadcrumbRegister', 'Daftar')}</span>
                    </nav>
                    <h1 className="font-literata mt-3 text-2xl font-bold text-[#12344E] sm:text-3xl">
                        {t('webinar.register.headTitle', 'Daftar Webinar')}
                    </h1>
                </div>

                <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                    {/* Left Column: Program Info & Participant Form */}
                    <div className={!pendingInvoice ? 'space-y-6 lg:col-span-7' : 'space-y-6 lg:col-span-12'}>
                        {/* Program Info Card */}
                        <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                            <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-3.5">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5B6B7F]">
                                    {t('webinar.register.programInfoTitle', 'Program Dipilih')}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] sm:w-36">
                                    <img
                                        src={resolveStorageUrl(webinar.thumbnail) || '/assets/images/placeholder.png'}
                                        alt={webinar.title}
                                        className="h-full w-full object-contain p-1.5"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <ProgramBadge type="webinar" />
                                    <h3 className="font-literata text-lg font-bold leading-snug text-[#12344E]">{webinar.title}</h3>
                                    <div className="flex items-center gap-2 text-sm text-[#475569]">
                                        <Calendar className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>{formatIndonesianDate(webinar.start_time, i18n.language || 'id')}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

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
                                            {t('webinar.register.emailLabel', 'Email')} <span className="text-[#B91C1C]">*</span>
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
                                                                    toast.error(t('webinar.register.enterValidEmail', 'Masukkan email yang valid'));
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
                                                                        toast.success(t('webinar.register.emailFoundToast', 'Email ditemukan!'));
                                                                    } else {
                                                                        setEmailExists(false);
                                                                        toast.info(t('webinar.register.emailNotFoundToast', 'Email tidak terdaftar'));
                                                                    }
                                                                } catch (error) {
                                                                    console.error('Error checking email:', error);
                                                                    setEmailExists(false);
                                                                    toast.error(t('webinar.register.emailCheckFailed', 'Gagal mengecek email'));
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
                                                {t('webinar.register.emailAutoFillNotice', 'Email ditemukan, data terisi otomatis')}
                                            </p>
                                        )}
                                        <InputError message={errors.email} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="name" className="text-sm font-semibold text-[#162230]">
                                            {t('webinar.register.nameLabel', 'Nama Lengkap')} <span className="text-[#B91C1C]">*</span>
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
                                            placeholder={t('webinar.register.namePlaceholder', 'Nama lengkap Anda')}
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone_number" className="text-sm font-semibold text-[#162230]">
                                            {t('webinar.register.phoneLabel', 'No. Telepon / WhatsApp')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="phone_number"
                                            type="tel"
                                            required
                                            tabIndex={3}
                                            autoComplete="tel"
                                            value={data.phone_number}
                                            onChange={(e) => setData('phone_number', e.target.value)}
                                            disabled={processing || emailExists}
                                            placeholder={t('webinar.register.phonePlaceholder', '08xxxxxxxxxx')}
                                        />
                                        {!emailExists && (
                                            <p className="text-xs leading-relaxed text-[#475569]">
                                                {t('webinar.register.phoneNoticeUnregistered', 'Nomor telepon akan digunakan sebagai password akun Anda')}
                                            </p>
                                        )}
                                        {emailExists && (
                                            <p className="text-xs font-medium text-[#1976D3]">
                                                {t('webinar.register.phoneNoticeRegistered', 'Pastikan nomor telepon sesuai dengan yang terdaftar')}
                                            </p>
                                        )}
                                        <InputError message={errors.phone_number} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="instance" className="text-sm font-semibold text-[#162230]">
                                            {t('webinar.register.instanceLabel', 'Instansi / Perusahaan')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="instance"
                                            type="text"
                                            tabIndex={4}
                                            autoComplete="organization"
                                            value={data.instance}
                                            onChange={(e) => setData('instance', e.target.value)}
                                            disabled={processing}
                                            placeholder={t('webinar.register.instancePlaceholder', 'Instansi atau perusahaan Anda')}
                                            required
                                        />
                                        <InputError message={errors.instance} />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="city" className="text-sm font-semibold text-[#162230]">
                                            {t('webinar.register.cityLabel', 'Kota Domisili')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="city"
                                            type="text"
                                            tabIndex={5}
                                            autoComplete="address-level2"
                                            value={data.city}
                                            onChange={(e) => setData('city', e.target.value)}
                                            disabled={processing}
                                            placeholder={t('webinar.register.cityPlaceholder', 'Kota domisili Anda')}
                                            required
                                        />
                                        <InputError message={errors.city} />
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* Right Column: Sticky Payment Summary / Pending Invoice / Access */}
                    <div className={!pendingInvoice ? 'lg:sticky lg:top-24 lg:col-span-5' : 'lg:col-span-12'}>
                        {hasAccess && (!activeInstallment || activeInstallment.is_fully_paid) ? (
                            <div className="flex flex-col items-center justify-center space-y-4 rounded-2xl border border-[#BBF7D0] bg-white p-6 text-center shadow-sm">
                                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
                                    <BadgeCheck className="h-7 w-7 text-[#15803D]" />
                                </div>
                                <div>
                                    <h2 className="font-literata mb-1.5 text-xl font-bold text-[#12344E]">
                                        {t('webinar.register.alreadyHaveAccessTitle', 'Anda Sudah Memiliki Akses')}
                                    </h2>
                                    <p className="text-sm text-[#475569]">
                                        {t('webinar.register.alreadyHaveAccessDesc', 'Anda sudah terdaftar di webinar ini. Silakan masuk ke dalam grup.')}
                                    </p>
                                </div>
                                <Button asChild className="h-11 w-full bg-[#15803D] text-white hover:bg-[#166534]" size="lg">
                                    <a href={webinar.group_url ?? ''} target="_blank" rel="noopener noreferrer">
                                        {t('webinar.register.btnEnterGroup', 'Masuk Group Webinar')}
                                    </a>
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
                                    if (
                                        confirm(
                                            t(
                                                'webinar.register.confirmCancel',
                                                'Apakah Anda yakin ingin membatalkan transaksi ini dan membuat pesanan baru?',
                                            ),
                                        )
                                    ) {
                                        setCancellingInvoice(true);
                                        try {
                                            await axios.post(route('invoice.cancel', pendingInvoice.id));
                                            toast.success(t('webinar.register.cancelSuccess', 'Pesanan berhasil dibatalkan.'));
                                            window.location.reload();
                                        } catch (err: any) {
                                            toast.error(err.response?.data?.message || t('webinar.register.cancelFailed', 'Gagal membatalkan pesanan.'));
                                            setCancellingInvoice(false);
                                        }
                                    }
                                }}
                            />
                        ) : !showFreeForm ? (
                            <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                                <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                    <h2 className="font-literata text-lg font-bold text-[#12344E]">
                                        {isFree
                                            ? t('webinar.register.registrationDetailTitle', 'Detail Pendaftaran')
                                            : t('webinar.register.paymentSummary', 'Ringkasan Pembayaran')}
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
                                                    {t('webinar.register.tabFullPayment', 'Bayar Penuh')}
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
                                                    {t('webinar.register.tabInstallment', 'Cicilan')} (
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
                                            productType="webinar"
                                            productId={webinar.id}
                                            productPrice={webinar.price}
                                            terms={installmentTerms}
                                            activeInstallment={activeInstallment}
                                            termsAccepted={termsAccepted}
                                            onTermsAcceptedChange={setTermsAccepted}
                                            onBeforePay={async () => {
                                                if (!activeInstallment && !termsAccepted) {
                                                    toast.error(
                                                        t('webinar.register.errors.agreeTermsRequired', 'Anda harus menyetujui syarat dan ketentuan!'),
                                                    );
                                                    return false;
                                                }
                                                return await ensureAuth();
                                            }}
                                        />
                                    ) : (
                                        <form onSubmit={handleCheckout} className="space-y-5">
                                            {isFree ? (
                                                <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-5 text-center">
                                                    <p className="font-literata text-xl font-bold text-[#15803D]">
                                                        {t('webinar.register.freeBadge', 'WEBINAR GRATIS')}
                                                    </p>
                                                    <p className="mt-1.5 text-sm text-[#166534]">
                                                        {t('webinar.register.freeInstruction', 'Dapatkan akses dengan mengikuti persyaratan berikut')}
                                                    </p>
                                                    <ul className="mt-3 space-y-1 text-left text-sm text-[#166534]">
                                                        {webinar.requirement_1 && <li>• {webinar.requirement_1}</li>}
                                                        {webinar.requirement_2 && <li>• {webinar.requirement_2}</li>}
                                                        {webinar.requirement_3 && <li>• {webinar.requirement_3}</li>}
                                                    </ul>
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
                                                                        {t('webinar.register.codeType', 'Jenis Kode')}
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
                                                                                {t('webinar.register.voucher', 'Voucher')}
                                                                            </Label>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            <RadioGroupItem value="referral" id="code-referral" />
                                                                            <Label htmlFor="code-referral" className="cursor-pointer text-sm text-[#162230]">
                                                                                {t('webinar.register.referral', 'Referral')}
                                                                            </Label>
                                                                        </div>
                                                                    </RadioGroup>
                                                                </div>

                                                                <div className="space-y-1.5">
                                                                    <Label htmlFor="promo-code" className="text-xs font-semibold text-[#162230]">
                                                                        {codeType === 'voucher'
                                                                            ? t('webinar.register.voucherCode', 'Kode Voucher / Promo')
                                                                            : t('webinar.register.referralCode', 'Kode Referral')}
                                                                    </Label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            id="promo-code"
                                                                            type="text"
                                                                            placeholder={
                                                                                codeType === 'voucher'
                                                                                    ? t('webinar.register.enterVoucherCode', 'Masukkan kode promo')
                                                                                    : t('webinar.register.enterReferralCode', 'Masukkan kode referral')
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
                                                                                    {t('webinar.register.promoAppliedSuccess', {
                                                                                        code: discountData.discount_code.code,
                                                                                        defaultValue: `Promo "${discountData.discount_code.code}" diterapkan!`,
                                                                                    })}
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
                                                                                <p className="text-xs font-semibold text-[#15803D]">
                                                                                    {t('webinar.register.referralSuccess', 'Kode referral valid!')}
                                                                                </p>
                                                                            </div>
                                                                            <p className="mt-1 text-xs text-[#166534]">
                                                                                {t('webinar.register.referralReferredBy', {
                                                                                    name: referralData.referrer?.name,
                                                                                    defaultValue: `Pembelian pertama Anda dirujuk oleh ${referralData.referrer?.name}. Reward poin akan masuk setelah pembayaran sukses.`,
                                                                                })}
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
                                                                        {t('webinar.register.useRewardPoints', 'Gunakan Reward Point')}
                                                                    </Label>
                                                                    <p className="text-xs text-[#475569]">
                                                                        {t('webinar.register.pointsBalance', {
                                                                            points: userPoints.toLocaleString('id-ID'),
                                                                            rupiah: userPoints.toLocaleString('id-ID'),
                                                                            defaultValue: `Anda memiliki ${userPoints.toLocaleString('id-ID')} poin (Rp ${userPoints.toLocaleString('id-ID')})`,
                                                                        })}
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
                                                                        {t('webinar.register.pointsToUse', 'Jumlah poin yang digunakan')}
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
                                                                                    setPointsError(
                                                                                        t('webinar.register.pointsExceedBalance', 'Poin melebihi saldo Anda.'),
                                                                                    );
                                                                                } else if (val > maxPointsAllowed) {
                                                                                    setPointsError(
                                                                                        t('webinar.register.pointsExceedMax', {
                                                                                            max: maxPointsAllowed,
                                                                                            defaultValue: `Maksimal poin yang dapat digunakan adalah ${maxPointsAllowed}.`,
                                                                                        }),
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
                                                                            {t('webinar.register.maxPoints', 'Maksimal')}
                                                                        </Button>
                                                                    </div>
                                                                    {pointsError && <p className="text-xs font-medium text-[#B91C1C]">{pointsError}</p>}
                                                                    {codeType === 'voucher' && !!discountData?.valid && (
                                                                        <p className="text-xs text-[#A16207]">
                                                                            {t(
                                                                                'webinar.register.pointsConflictVoucher',
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
                                                        {webinar.strikethrough_price > 0 && (
                                                            <>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-[#475569]">
                                                                        {t('webinar.register.originalPrice', 'Harga Normal')}
                                                                    </span>
                                                                    <span className="text-[#5B6B7F] line-through tabular-nums">
                                                                        Rp {webinar.strikethrough_price.toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-[#475569]">
                                                                        {t('webinar.register.discount', 'Diskon')}
                                                                    </span>
                                                                    <span className="font-semibold text-[#15803D] tabular-nums">
                                                                        -Rp {(webinar.strikethrough_price - webinar.price).toLocaleString('id-ID')}
                                                                    </span>
                                                                </div>
                                                            </>
                                                        )}
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-[#475569]">{t('webinar.register.webinarPrice', 'Harga Webinar')}</span>
                                                            <span className="font-semibold text-[#162230] tabular-nums">
                                                                Rp {webinar.price.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>

                                                        {discountData?.valid && codeType === 'voucher' && (
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-[#475569]">
                                                                    {t('webinar.register.promoDiscount', {
                                                                        code: discountData.discount_code.code,
                                                                        defaultValue: `Diskon Promo (${discountData.discount_code.code})`,
                                                                    })}
                                                                </span>
                                                                <span className="font-semibold text-[#15803D] tabular-nums">
                                                                    -Rp {discountData.discount_amount.toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {pointsChecked && pointsToUse > 0 && !pointsError && (
                                                            <div className="flex items-center justify-between text-sm">
                                                                <span className="text-[#475569]">
                                                                    {t('webinar.register.pointsDiscount', 'Potongan Poin')}
                                                                </span>
                                                                <span className="font-semibold text-[#15803D] tabular-nums">
                                                                    -Rp {pointsToUse.toLocaleString('id-ID')}
                                                                </span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-[#475569]">
                                                                {t('webinar.register.transactionFee', 'Biaya Transaksi')}
                                                            </span>
                                                            <span className="font-medium text-[#162230] tabular-nums">
                                                                Rp {adminFee.toLocaleString('id-ID')}
                                                            </span>
                                                        </div>

                                                        <Separator className="bg-[#DCE3EC]" />

                                                        <div className="flex items-center justify-between pt-1">
                                                            <span className="font-semibold text-[#12344E]">
                                                                {t('webinar.register.totalPayment', 'Total Pembayaran')}
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
                                                        {t('webinar.register.agreeTerms', 'Saya menyetujui')}{' '}
                                                        <a
                                                            href="/terms-and-conditions"
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="font-semibold text-[#1976D3] hover:underline"
                                                        >
                                                            {t('webinar.register.termsAndConditions', 'syarat dan ketentuan')}
                                                        </a>{' '}
                                                        {t('webinar.register.termsNoticeSuffix', 'yang berlaku')}
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
                                                            {t('webinar.register.processing', 'Memproses...')}
                                                        </span>
                                                    ) : isFree ? (
                                                        t('webinar.register.btnUploadProof', 'Upload Bukti Follow')
                                                    ) : (
                                                        t('webinar.register.btnPayNow', 'Bayar Sekarang')
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
                                                <span>{t('webinar.register.secureNotice', 'Pembayaran aman dan terenkripsi SSL')}</span>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleFreeCheckout}>
                                <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                                    <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                        <h2 className="font-literata text-lg font-bold text-[#12344E]">
                                            {t('webinar.register.uploadProofTitle', 'Upload Bukti Follow & Tag')}
                                        </h2>
                                    </div>

                                    <div className="space-y-4 p-5 sm:p-6">
                                        {[1, 2, 3].map((index) => {
                                            const requirementKey = `requirement_${index}`;
                                            const proofKey = `${requirementKey}_proof` as const;
                                            const requirementText = webinar[requirementKey as keyof Webinar] as string | null | undefined;

                                            return (
                                                <div key={index} className="space-y-1.5">
                                                    <Label htmlFor={proofKey} className="text-sm font-semibold text-[#162230]">
                                                        {t('webinar.register.proofLabel', {
                                                            index,
                                                            requirement: requirementText || `Persyaratan ${index}`,
                                                            defaultValue: `Bukti Persyaratan ${index}: ${requirementText || `Persyaratan ${index}`}`,
                                                        })}
                                                    </Label>
                                                    <Input
                                                        id={proofKey}
                                                        data-field={proofKey}
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(proofKey, e.target.files?.[0] || null)}
                                                        className={fileErrors[proofKey] ? 'border-[#B91C1C]' : ''}
                                                        required
                                                    />
                                                    <p className="text-xs text-[#475569]">
                                                        {requirementText} (Maks. 2MB)
                                                    </p>
                                                </div>
                                            );
                                        })}

                                        <div className="flex gap-2.5 pt-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setShowFreeForm(false);
                                                    setFileErrors({
                                                        requirement_1_proof: false,
                                                        requirement_2_proof: false,
                                                        requirement_3_proof: false,
                                                    });
                                                    setFreeFormData({
                                                        requirement_1_proof: null,
                                                        requirement_2_proof: null,
                                                        requirement_3_proof: null,
                                                    });
                                                }}
                                                className="h-11 flex-1"
                                            >
                                                {t('webinar.register.btnBack', 'Kembali')}
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={
                                                    loading ||
                                                    !freeFormData.requirement_1_proof ||
                                                    !freeFormData.requirement_2_proof ||
                                                    !freeFormData.requirement_3_proof ||
                                                    Object.values(fileErrors).some((e) => e)
                                                }
                                                className="h-11 flex-1 font-semibold"
                                            >
                                                {loading
                                                    ? t('webinar.register.processing', 'Memproses...')
                                                    : t('webinar.register.btnGetFreeAccess', 'Dapatkan Akses Gratis')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </main>
            <Toaster position="top-center" richColors />
        </div>
    );
}
