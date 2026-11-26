import { CheckoutHeader } from '@/components/checkout-header';
import { ProgramBadge } from '@/components/program-badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatIndonesianDate, resolveStorageUrl } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { format } from 'date-fns';
import { id, enUS } from 'date-fns/locale';
import { AlertCircle, BadgeCheck, Calendar, CheckCircle2, ChevronDown, Clock, Loader2, Lock, User, RefreshCw, Shield, Tag } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import InstallmentOptions, { InstallmentTermOption, ActiveInstallmentData } from '@/components/installment-options';
import { useTranslation } from 'react-i18next';

interface Mentor {
    id: string;
    name: string;
}
interface Schedule {
    id: string;
    schedule_date?: string;
    start_date?: string;
}

interface Program {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    registration_deadline?: string;
    mentors: Mentor[];
    schedules: Schedule[];
    document_required?: boolean;
    document_description?: string | null;
}

interface Application {
    id: string;
    status: 'pending' | 'approved' | 'rejected';
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

interface GuestFormData {
    name: string;
    email: string;
    phone_number: string;
    instance: string;
    city: string;
}

interface PendingCheckoutData {
    programSlug: string;
    timestamp: number;
    promoCode: string;
    termsAccepted: boolean;
    discountData: DiscountData | null;
    needsDocumentUpload?: boolean;
    codeType?: 'voucher' | 'referral';
    referralValid?: boolean;
    pointsChecked?: boolean;
    pointsToUse?: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) return error.message;
    return fallback;
}

interface RegisterProps {
    program: Program;
    hasAccess: boolean;
    activeInstallment?: ActiveInstallmentData | null;
    pendingInvoiceUrl?: string | null;
    regularApplication?: Application | null;
    scholarshipApplication?: Application | null;
    isScholarship: boolean;
    installmentTerms?: InstallmentTermOption[];
}

export default function Register({
    program,
    hasAccess,
    activeInstallment: initialActiveInstallment = null,
    pendingInvoiceUrl,
    regularApplication,
    scholarshipApplication,
    isScholarship,
    installmentTerms = [],
}: RegisterProps) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? enUS : id;
    const atWord = i18n.language === 'en' ? 'at' : 'pukul';
    const { auth } = usePage<SharedData>().props;
    const user = auth.user as
        | {
              name?: string;
              email?: string;
              phone_number?: string;
              instance?: string;
              city?: string;
          }
        | null
        | undefined;
    const isLoggedIn = !!user;
    const isProfileComplete = !!(isLoggedIn && user?.phone_number && user?.instance && user?.city);

    const [activeInstallment, setActiveInstallment] = useState<ActiveInstallmentData | null>(initialActiveInstallment || null);
    const [paymentMode, setPaymentMode] = useState<'full' | 'installment'>(initialActiveInstallment ? 'installment' : 'full');
    const [isLoading, setIsLoading] = useState(false);
    const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
    const [documentAttachment, setDocumentAttachment] = useState<File | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);

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

    const [checkingEmail, setCheckingEmail] = useState(false);
    const [emailExists, setEmailExists] = useState(false);
    const [guestScholarshipStatus, setGuestScholarshipStatus] = useState<string | null>(null);
    const [guestFormData, setGuestFormData] = useState<GuestFormData>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        phone_number: user?.phone_number ?? '',
        instance: user?.instance ?? '',
        city: user?.city ?? '',
    });

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

    const isApprovedScholarship = scholarshipApplication?.status === 'approved' || guestScholarshipStatus === 'approved';
    const isScholarshipNotApproved = program.type === 'scholarship' && !isApprovedScholarship;
    const displayPrice = isScholarshipNotApproved ? 0 : (isScholarship && program.scholarship_price ? program.scholarship_price : program.price);
    const promoDiscountAmount = discountData?.valid ? discountData.discount_amount : 0;

    const maxPointsAllowed = displayPrice - promoDiscountAmount;
    const activeFinalPrice = displayPrice - promoDiscountAmount - (pointsChecked ? pointsToUse : 0);
    const adminFee = activeFinalPrice <= 0 ? 0 : 5000;
    const totalPrice = activeFinalPrice + adminFee;
    const deadline = program.registration_deadline ? new Date(program.registration_deadline) : null;
    const getDate = (s: Schedule) => s.schedule_date || s.start_date || '';
    const requiresDocumentUpload = program.type === 'regular' && !!program.document_required && !isScholarship;
    const documentStatus = regularApplication?.status ?? null;
    const hasApprovedDocument = !requiresDocumentUpload || documentStatus === 'approved';
    const isDocumentPending = documentStatus === 'pending';
    const isDocumentRejected = documentStatus === 'rejected';

    const updateGuestForm = (field: keyof GuestFormData, value: string) => {
        setGuestFormData((prev) => ({ ...prev, [field]: value }));
    };

    const isGuestFormComplete = useCallback(() => {
        if (isLoggedIn) return true;

        const hasEmail = !!guestFormData.email;
        const hasPhone = !!guestFormData.phone_number;
        const hasNameOrEmailExists = !!guestFormData.name || emailExists;
        const hasInstanceOrEmailExists = !!guestFormData.instance || emailExists || guestScholarshipStatus === 'approved';
        const hasCityOrEmailExists = !!guestFormData.city || emailExists || guestScholarshipStatus === 'approved';

        return hasEmail && hasPhone && hasNameOrEmailExists && hasInstanceOrEmailExists && hasCityOrEmailExists;
    }, [isLoggedIn, guestFormData, emailExists, guestScholarshipStatus]);

    const validatePromoCode = useCallback(async () => {
        if (!promoCode.trim() || displayPrice === 0) return;

        setPromoLoading(true);
        setPromoError('');

        try {
            const requestData: Record<string, string | number> = {
                code: promoCode,
                amount: displayPrice,
                product_type: 'certification_program',
                product_id: program.id,
            };

            if (!isLoggedIn && emailExists && guestFormData.email) {
                requestData.email = guestFormData.email;
            }

            const response = await axios.post('/api/discount-codes/validate', requestData);
            const data = response.data;

            if (data.valid) {
                setDiscountData(data);
                setPromoError('');
            } else {
                setDiscountData(null);
                setPromoError(data.message || 'Kode promo tidak valid');
            }
        } catch (error: unknown) {
            setDiscountData(null);
            if (axios.isAxiosError(error)) {
                setPromoError(error.response?.data?.message || 'Terjadi kesalahan saat memvalidasi kode promo');
            } else {
                setPromoError('Terjadi kesalahan saat memvalidasi kode promo');
            }
        } finally {
            setPromoLoading(false);
        }
    }, [displayPrice, emailExists, guestFormData.email, isLoggedIn, program.id, promoCode]);

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
    }, []);

    const validateReferralCode = useCallback(async () => {
        if (!promoCode.trim() || displayPrice === 0) return;

        setReferralLoading(true);
        setReferralError('');

        try {
            const response = await axios.post('/api/referral/validate', {
                code: promoCode,
                email: !isLoggedIn ? guestFormData.email : undefined,
            });
            const dataRes = response.data;

            if (dataRes.valid) {
                setReferralData(dataRes);
                setReferralError('');
            } else {
                setReferralData(null);
                setReferralError(dataRes.message || 'Kode referral tidak valid');
            }
        } catch (error: unknown) {
            setReferralData(null);
            if (axios.isAxiosError(error)) {
                setReferralError(error.response?.data?.message || 'Terjadi kesalahan saat memvalidasi kode referral');
            } else {
                setReferralError('Terjadi kesalahan saat memvalidasi kode referral');
            }
        } finally {
            setReferralLoading(false);
        }
    }, [displayPrice, isLoggedIn, guestFormData.email, promoCode]);

    useEffect(() => {
        if (!promoCode.trim() || displayPrice === 0) {
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
    }, [displayPrice, promoCode, codeType, validatePromoCode, validateReferralCode]);

    useEffect(() => {
        if (isLoggedIn) return;

        const email = guestFormData.email.trim();
        if (!email || !email.includes('@')) {
            setEmailExists(false);
            return;
        }

        const timer = setTimeout(async () => {
            setCheckingEmail(true);

            try {
                const response = await axios.post('/api/check-email', {
                    email,
                    certification_program_id: program.id,
                    program_id: program.id,
                });
                const data = response.data;

                if (data.exists) {
                    setEmailExists(true);
                    setGuestFormData((prev) => ({
                        ...prev,
                        name: data.name || prev.name,
                        phone_number: data.phone_number || prev.phone_number,
                        instance: data.instance || prev.instance,
                        city: data.city || prev.city,
                    }));

                    if (data.active_installment) {
                        setActiveInstallment(data.active_installment);
                        setPaymentMode('installment');
                    } else {
                        setActiveInstallment(null);
                    }
                } else {
                    setEmailExists(false);
                    setActiveInstallment(null);
                }

                // Always check and store scholarship application status, regardless of user existence
                if (data.scholarship_application_status) {
                    setGuestScholarshipStatus(data.scholarship_application_status);
                } else {
                    setGuestScholarshipStatus(null);
                }
            } catch {
                setEmailExists(false);
                setActiveInstallment(null);
                setGuestScholarshipStatus(null);
            } finally {
                setCheckingEmail(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [guestFormData.email, isLoggedIn, program.id]);

    const savePendingCheckout = useCallback(
        (needsDocumentUpload = false) => {
            const pendingCheckoutData: PendingCheckoutData = {
                programSlug: program.slug,
                timestamp: Date.now(),
                promoCode,
                termsAccepted,
                discountData,
                needsDocumentUpload,
                codeType,
                referralValid: codeType === 'referral' && !!referralData?.valid,
                pointsChecked,
                pointsToUse,
            };

            sessionStorage.setItem('pendingCertificationCheckout', JSON.stringify(pendingCheckoutData));
        },
        [discountData, program.slug, promoCode, termsAccepted, codeType, referralData, pointsChecked, pointsToUse],
    );

    const refreshCSRFToken = useCallback(async (): Promise<string> => {
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
    }, []);

    const ensureAuthenticated = useCallback(async (): Promise<boolean> => {
        if (isLoggedIn) return true;

        if (!guestFormData.email || !guestFormData.phone_number) {
            toast.error('Email dan nomor telepon wajib diisi.');
            return false;
        }

        if (!guestFormData.instance || !guestFormData.city) {
            toast.error('Instansi dan Kota Domisili wajib diisi.');
            return false;
        }

        setIsLoading(true);

        try {
            if (emailExists) {
                const loginResponse = await axios.post(route('auto-login'), {
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                });

                const loginData = loginResponse.data;
                if (!loginData.success) {
                    throw new Error(loginData.message || 'Gagal login otomatis.');
                }

                toast.success('Login berhasil. Melanjutkan pendaftaran...');
            } else {
                if (!guestFormData.name) {
                    toast.error('Nama wajib diisi.');
                    setIsLoading(false);
                    return false;
                }

                await axios.post(route('register'), {
                    name: guestFormData.name,
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                    password: guestFormData.phone_number,
                    password_confirmation: guestFormData.phone_number,
                    affiliate_code: sessionStorage.getItem('affiliate_code') || '',
                });

                toast.success('Registrasi berhasil. Melanjutkan pendaftaran...');
            }

            return true;
        } catch (error: unknown) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Gagal memproses login/registrasi otomatis.');
            } else {
                toast.error(getErrorMessage(error, 'Gagal memproses login/registrasi otomatis.'));
            }
            return false;
        }
    }, [emailExists, guestFormData.email, guestFormData.instance, guestFormData.city, guestFormData.name, guestFormData.phone_number, isLoggedIn]);

    // Show scholarship prompt only when the user hasn't applied yet or their application was rejected.
    // For guests, consider `guestScholarshipStatus` returned by `/api/check-email`.
    const showScholarshipWarning = !!(
        isScholarship &&
        ((!scholarshipApplication && !guestScholarshipStatus) ||
            (scholarshipApplication && scholarshipApplication.status === 'rejected') ||
            guestScholarshipStatus === 'rejected')
    );

    // Determine if scholarship is not approved (either for logged user or guest)
    const scholarshipNotApproved = !!(
        isScholarship &&
        ((scholarshipApplication && scholarshipApplication.status !== 'approved') ||
            (guestScholarshipStatus && guestScholarshipStatus !== 'approved'))
    );

    const handleDocumentSubmit = () => {
        if (!documentAttachment) {
            toast.error('Pilih dokumen pendukung terlebih dahulu');
            return;
        }

        const formData = new FormData();
        formData.append('document_attachment', documentAttachment);

        router.post(route('certification-programs.apply-regular', program.slug), formData, {
            forceFormData: true,
            onSuccess: () => {
                setIsDocumentDialogOpen(false);
                setDocumentAttachment(null);
                toast.success('Dokumen berhasil dikirim. Menunggu verifikasi admin.');
            },
            onError: () => {
                toast.error('Gagal mengirim dokumen pendukung');
            },
        });
    };

    const submitPayment = useCallback(
        async (
            overrideDiscountData?: DiscountData | null,
            overrideCodeType?: 'voucher' | 'referral',
            overridePromoCode?: string,
            overrideReferralValid?: boolean,
            overridePointsChecked?: boolean,
            overridePointsToUse?: number,
        ): Promise<void> => {
            const activeDiscountData = overrideDiscountData !== undefined ? overrideDiscountData : discountData;
            const originalDiscountAmount =
                program.strikethrough_price && program.strikethrough_price > 0 ? program.strikethrough_price - program.price : 0;
            const promoDiscountAmount = activeDiscountData?.valid ? activeDiscountData.discount_amount : 0;

            const currentPointsChecked = overridePointsChecked !== undefined ? overridePointsChecked : pointsChecked;
            const currentPointsToUse = overridePointsToUse !== undefined ? overridePointsToUse : pointsToUse;
            const pointsDeduction = currentPointsChecked ? currentPointsToUse : 0;

            const activeFinalPrice = displayPrice - promoDiscountAmount - pointsDeduction;
            const activeTotalPrice = activeFinalPrice <= 0 ? 0 : activeFinalPrice + adminFee;

            const invoiceData: Record<string, string | number> = {
                type: 'certification_program',
                id: program.id,
                discount_amount: originalDiscountAmount + promoDiscountAmount,
                nett_amount: activeFinalPrice,
                transaction_fee: adminFee,
                total_amount: activeTotalPrice,
                is_scholarship: isScholarship ? 1 : 0,
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
                        sessionStorage.removeItem('pendingCertificationCheckout');
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
        },
        [displayPrice, discountData, codeType, promoCode, referralData, pointsChecked, pointsToUse, program.id, program.price, program.strikethrough_price, isScholarship],
    );

    const handleCheckout = useCallback(async () => {
        if (!termsAccepted && displayPrice > 0) {
            toast.error('Anda harus menyetujui syarat dan ketentuan.');
            return;
        }

        // Check if guest form is complete before proceeding
        if (!isLoggedIn && !isGuestFormComplete()) {
            toast.error('Lengkapi semua data diri terlebih dahulu.');
            return;
        }

        const authenticated = await ensureAuthenticated();
        if (!authenticated) {
            return;
        }

        if (requiresDocumentUpload && !hasApprovedDocument) {
            if (isDocumentPending) {
                setIsLoading(false);
                return;
            }

            setIsDocumentDialogOpen(true);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);

        try {
            await submitPayment();
        } catch (error) {
            toast.error(getErrorMessage(error, 'Terjadi kesalahan saat proses pembayaran.'));
            setIsLoading(false);
        }
    }, [
        displayPrice,
        ensureAuthenticated,
        hasApprovedDocument,
        isDocumentPending,
        isDocumentRejected,
        requiresDocumentUpload,
        submitPayment,
        termsAccepted,
        isLoggedIn,
        isGuestFormComplete,
    ]);

    const ensureAuthenticatedForDocument = useCallback(async () => {
        if (!guestFormData.email || !guestFormData.phone_number) {
            toast.error('Email dan nomor telepon wajib diisi.');
            return;
        }

        if (!guestFormData.instance || !guestFormData.city) {
            toast.error('Instansi dan Kota Domisili wajib diisi.');
            return;
        }

        setIsLoading(true);

        try {
            if (emailExists) {
                const loginResponse = await axios.post(route('auto-login'), {
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                });

                const loginData = loginResponse.data;
                if (!loginData.success) {
                    throw new Error(loginData.message || 'Gagal login otomatis.');
                }

                toast.success('Login berhasil. Membuka form upload dokumen...');
            } else {
                if (!guestFormData.name) {
                    toast.error('Nama wajib diisi.');
                    setIsLoading(false);
                    return;
                }

                await axios.post(route('register'), {
                    name: guestFormData.name,
                    email: guestFormData.email,
                    phone_number: guestFormData.phone_number,
                    instance: guestFormData.instance,
                    city: guestFormData.city,
                    password: guestFormData.phone_number,
                    password_confirmation: guestFormData.phone_number,
                });

                toast.success('Registrasi berhasil. Membuka form upload dokumen...');
            }

            savePendingCheckout(true);
            window.location.reload();
        } catch (error: unknown) {
            setIsLoading(false);
            if (axios.isAxiosError(error)) {
                toast.error(error.response?.data?.message || 'Gagal memproses login/registrasi otomatis.');
            } else {
                toast.error(getErrorMessage(error, 'Gagal memproses login/registrasi otomatis.'));
            }
        }
    }, [emailExists, guestFormData.email, guestFormData.instance, guestFormData.city, guestFormData.name, guestFormData.phone_number, savePendingCheckout]);

    useEffect(() => {
        if (!isLoggedIn) return;

        const pendingCheckoutRaw = sessionStorage.getItem('pendingCertificationCheckout');
        if (!pendingCheckoutRaw) return;

        try {
            const pendingCheckout = JSON.parse(pendingCheckoutRaw) as PendingCheckoutData;

            const fiveMinutes = 5 * 60 * 1000;
            if (Date.now() - pendingCheckout.timestamp > fiveMinutes) {
                sessionStorage.removeItem('pendingCertificationCheckout');
                return;
            }

            if (pendingCheckout.programSlug !== program.slug) {
                sessionStorage.removeItem('pendingCertificationCheckout');
                return;
            }

            // Check if pending document upload
            if (pendingCheckout.needsDocumentUpload) {
                sessionStorage.removeItem('pendingCertificationCheckout');
                setIsDocumentDialogOpen(true);
                return;
            }

            if (pendingCheckout.promoCode) {
                setPromoCode(pendingCheckout.promoCode);
            }
            if (pendingCheckout.codeType) {
                setCodeType(pendingCheckout.codeType);
            }
            if (pendingCheckout.referralValid) {
                setReferralData({ valid: true });
            }
            if (pendingCheckout.pointsChecked) {
                setPointsChecked(true);
            }
            if (pendingCheckout.pointsToUse) {
                setPointsToUse(pendingCheckout.pointsToUse);
            }

            setTermsAccepted(pendingCheckout.termsAccepted || false);
            setDiscountData(pendingCheckout.discountData || null);
            sessionStorage.removeItem('pendingCertificationCheckout');

            // Delay checkout to wait state update
            setTimeout(() => {
                setIsLoading(true);
                submitPayment(
                    pendingCheckout.discountData || null,
                    pendingCheckout.codeType,
                    pendingCheckout.promoCode,
                    pendingCheckout.referralValid,
                    pendingCheckout.pointsChecked,
                    pendingCheckout.pointsToUse
                ).catch((error: any) => {
                    console.error('Failed to process payment:', error);
                    toast.error(error.message || 'Terjadi kesalahan saat proses pembayaran.');
                    setIsLoading(false);
                });
            }, 1000);
        } catch {
            sessionStorage.removeItem('pendingCertificationCheckout');
        }
    }, [submitPayment, isLoggedIn, program.slug]);

    if (hasAccess && (!activeInstallment || activeInstallment.is_fully_paid)) {
        return (
            <div className="min-h-screen bg-[#FAF8F4]">
                <Head title={t('certificationProgram.register.headTitleEnrolled', 'Terdaftar - {{title}}', { title: program.title })} />
                <CheckoutHeader backHref={route('certification-programs.detail', program.slug)} />
                <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md rounded-2xl border border-[#BBF7D0] bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#DCFCE7]">
                            <CheckCircle2 className="h-8 w-8 text-[#15803D]" />
                        </div>
                        <h1 className="font-literata mb-2 text-2xl font-bold text-[#12344E]">
                            {t('certificationProgram.register.enrolledTitle', 'Anda Sudah Terdaftar!')}
                        </h1>
                        <p className="mb-6 text-sm leading-relaxed text-[#475569]">
                            {t('certificationProgram.register.enrolledDesc', 'Akses materi pembelajaran tersedia di dashboard.')}
                        </p>
                        <div className="flex w-full flex-col gap-2.5 sm:flex-row">
                            <Button asChild className="h-11 flex-1 font-semibold" size="lg">
                                <Link href={route('profile.index')}>
                                    {t('certificationProgram.register.btnToDashboard', 'Ke Dashboard')}
                                </Link>
                            </Button>
                            <Button asChild variant="outline" className="h-11 flex-1" size="lg">
                                <Link href={route('certification-program.index')}>
                                    {t('certificationProgram.register.btnViewOtherPrograms', 'Lihat Program Lain')}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    if (isLoggedIn && !isProfileComplete) {
        return (
            <div className="min-h-screen bg-[#FAF8F4]">
                <Head title={t('certificationProgram.register.headTitle', 'Daftar - {{title}}', { title: program.title })} />
                <CheckoutHeader backHref={route('certification-programs.detail', program.slug)} />
                <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
                    <div className="w-full max-w-md rounded-2xl border border-[#DCE3EC] bg-white p-8 text-center shadow-sm">
                        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3EB]">
                            <User className="h-7 w-7 text-[#D95B16]" />
                        </div>
                        <h1 className="font-literata mb-2 text-2xl font-bold text-[#12344E]">
                            {t('certificationProgram.register.incompleteProfileTitle', 'Profil Belum Lengkap')}
                        </h1>
                        <p className="mb-6 text-sm leading-relaxed text-[#475569]">
                            {t(
                                'certificationProgram.register.incompleteProfileDesc',
                                'Silakan lengkapi nomor telepon, instansi, dan kota domisili terlebih dahulu sebelum melanjutkan pendaftaran.',
                            )}
                        </p>
                        <Button asChild className="h-11 w-full font-semibold" size="lg">
                            <Link href={route('profile.edit', { redirect: window.location.href })}>
                                {t('certificationProgram.register.btnCompleteProfile', 'Lengkapi Profil')}
                            </Link>
                        </Button>
                    </div>
                </section>
            </div>
        );
    }

    const handlePrimaryAction = () => {
        if (requiresDocumentUpload && !hasApprovedDocument) {
            if (isDocumentPending) {
                return;
            }

            // If guest, need to authenticate first
            if (!isLoggedIn) {
                if (!isGuestFormComplete()) {
                    toast.error('Lengkapi semua data diri terlebih dahulu.');
                    return;
                }

                // Proceed with auto-login/register
                void ensureAuthenticatedForDocument();
                return;
            }

            setIsDocumentDialogOpen(true);
            return;
        }

        void handleCheckout();
    };

    const promoApplied = (codeType === 'voucher' && !!discountData?.valid) || (codeType === 'referral' && !!referralData?.valid);
    const isRegularPendingVerification = !!regularApplication && regularApplication.status === 'pending' && !isScholarship && requiresDocumentUpload;
    const isPrimaryDisabled =
        isLoading ||
        !!activeInstallment ||
        showScholarshipWarning ||
        (!isLoggedIn && !isGuestFormComplete()) ||
        (requiresDocumentUpload && isDocumentPending) ||
        isRegularPendingVerification ||
        scholarshipNotApproved ||
        (displayPrice > 0 && !termsAccepted);

    const disabledReason = (() => {
        if (isLoading || !isPrimaryDisabled) return null;
        if (showScholarshipWarning || scholarshipNotApproved) {
            return t('certificationProgram.register.disabledScholarshipHint', 'Ajukan dan tunggu persetujuan beasiswa terlebih dahulu.');
        }
        if ((requiresDocumentUpload && isDocumentPending) || isRegularPendingVerification) {
            return t('certificationProgram.register.docSentWaiting', 'Dokumen sudah dikirim dan sedang menunggu verifikasi admin.');
        }
        if (!isLoggedIn && !isGuestFormComplete()) {
            return t('certificationProgram.register.disabledGuestHint', 'Lengkapi seluruh data peserta yang bertanda * di sebelah kiri.');
        }
        if (!!activeInstallment) {
            return t(
                'webinar.register.disabledInstallmentHint',
                'Anda memiliki cicilan aktif. Gunakan tab Cicilan di atas untuk membayar termin berikutnya.',
            );
        }
        if (displayPrice > 0 && !termsAccepted) {
            return t(
                'webinar.register.disabledTermsHint',
                'Centang persetujuan syarat dan ketentuan di atas untuk mengaktifkan tombol bayar.',
            );
        }
        return null;
    })();

    return (
        <div className="min-h-screen bg-[#FAF8F4]">
            <Head title={t('certificationProgram.register.headTitle', 'Daftar - {{title}}', { title: program.title })} />
            <CheckoutHeader backHref={route('certification-programs.detail', program.slug)} />

            <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
                <div className="mb-6">
                    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs text-[#5B6B7F] sm:text-sm">
                        <Link href="/certification-program" className="transition-colors hover:text-[#1976D3]">
                            {t('certificationProgram.dashboard.headTitle', 'Program Sertifikasi')}
                        </Link>
                        <span>/</span>
                        <Link
                            href={`/certification-program/${program.slug}`}
                            className="max-w-[240px] truncate transition-colors hover:text-[#1976D3] sm:max-w-md"
                        >
                            {program.title}
                        </Link>
                        <span>/</span>
                        <span className="font-medium text-[#12344E]">{t('bootcamp.register.headTitle', 'Daftar')}</span>
                    </nav>
                    <h1 className="font-literata mt-3 text-2xl font-bold text-[#12344E] sm:text-3xl">
                        {t('certificationProgram.register.headTitle', 'Daftar - {{title}}', { title: program.title })}
                    </h1>
                </div>

                <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
                    {/* Left Column: Program Info, Alerts & Guest Form */}
                    <div className={!pendingInvoiceUrl ? 'space-y-6 lg:col-span-7' : 'space-y-6 lg:col-span-12'}>
                        <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                            <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-3.5">
                                <h2 className="text-sm font-semibold uppercase tracking-wide text-[#5B6B7F]">
                                    {t('webinar.register.programInfoTitle', 'Program Dipilih')}
                                </h2>
                            </div>
                            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                                <div className="h-24 w-full shrink-0 overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] sm:w-36">
                                    <img
                                        src={resolveStorageUrl(program.thumbnail) || '/assets/images/placeholder.png'}
                                        alt={program.title}
                                        className="h-full w-full object-contain p-1.5"
                                    />
                                </div>
                                <div className="min-w-0 flex-1 space-y-2">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <ProgramBadge
                                            type="certification-program"
                                            labelOverride={t('certificationProgram.dashboard.headTitle', 'Program Sertifikasi')}
                                        />
                                        <span className="rounded-md border border-[#BFDBFE] bg-[#EAF3FC] px-2.5 py-0.5 text-xs font-semibold text-[#155FA8]">
                                            {isScholarship
                                                ? t('certificationProgram.register.scholarshipRegistration', 'Jalur Beasiswa')
                                                : t('certificationProgram.register.regularRegistration', 'Jalur Reguler')}
                                        </span>
                                    </div>
                                    <h3 className="font-literata text-lg font-bold leading-snug text-[#12344E]">{program.title}</h3>
                                </div>
                            </div>
                        </div>

                        {!isLoggedIn && (
                            <form className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                    <div>
                                        <h2 className="font-literata text-lg font-bold text-[#12344E]">
                                            {t('webinar.register.participantDataTitle', 'Data Peserta')}
                                        </h2>
                                        <p className="text-xs text-[#475569]">
                                            {t(
                                                'certificationProgram.register.personalDataDesc',
                                                'Sistem akan melanjutkan ke login atau registrasi otomatis.',
                                            )}
                                        </p>
                                    </div>
                                    <span className="text-xs text-[#5B6B7F]">
                                        <span className="font-semibold text-[#B91C1C]">*</span>{' '}
                                        {t('webinar.register.requiredLegend', 'Wajib diisi')}
                                    </span>
                                </div>

                                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label htmlFor="guest-email" className="text-sm font-semibold text-[#162230]">
                                            {t('certificationProgram.register.labelEmail', 'Email')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                id="guest-email"
                                                type="email"
                                                placeholder="email@example.com"
                                                value={guestFormData.email}
                                                onChange={(event) => updateGuestForm('email', event.target.value)}
                                                required
                                                className="pr-10"
                                            />
                                            {checkingEmail && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                    <Loader2 className="h-4 w-4 animate-spin text-[#5B6B7F]" />
                                                </div>
                                            )}
                                            {!checkingEmail && emailExists && (
                                                <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                    <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
                                                </div>
                                            )}
                                        </div>
                                        {emailExists && (
                                            <p className="text-xs font-medium text-[#15803D]">
                                                {t('certificationProgram.register.emailAutoFilled', 'Email ditemukan, data terisi otomatis')}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="guest-name" className="text-sm font-semibold text-[#162230]">
                                            {t('certificationProgram.register.labelName', 'Nama Lengkap')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="guest-name"
                                            type="text"
                                            placeholder={t('certificationProgram.register.placeholderName', 'Nama lengkap')}
                                            value={guestFormData.name}
                                            onChange={(event) => updateGuestForm('name', event.target.value)}
                                            disabled={emailExists}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="guest-phone" className="text-sm font-semibold text-[#162230]">
                                            {t('certificationProgram.register.labelPhone', 'No. Telepon / WhatsApp')}{' '}
                                            <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="guest-phone"
                                            type="tel"
                                            placeholder={t('certificationProgram.register.placeholderPhone', '08xxxxxxxxxx')}
                                            value={guestFormData.phone_number}
                                            onChange={(event) => updateGuestForm('phone_number', event.target.value)}
                                            disabled={emailExists}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="guest-instance" className="text-sm font-semibold text-[#162230]">
                                            {t('certificationProgram.register.labelInstanceOrg', 'Instansi / Perusahaan')}{' '}
                                            <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="guest-instance"
                                            type="text"
                                            placeholder={t('certificationProgram.register.placeholderInstanceFull', 'Instansi atau perusahaan Anda')}
                                            value={guestFormData.instance}
                                            onChange={(event) => updateGuestForm('instance', event.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="guest-city" className="text-sm font-semibold text-[#162230]">
                                            {t('certificationProgram.register.labelCity', 'Kota Domisili')} <span className="text-[#B91C1C]">*</span>
                                        </Label>
                                        <Input
                                            id="guest-city"
                                            type="text"
                                            placeholder={t('certificationProgram.register.placeholderCity', 'Kota domisili Anda')}
                                            value={guestFormData.city}
                                            onChange={(event) => updateGuestForm('city', event.target.value)}
                                            disabled={isLoading}
                                            required
                                        />
                                    </div>
                                </div>
                            </form>
                        )}

                        {pendingInvoiceUrl && !isLoading && (
                            <Alert className="rounded-2xl border border-[#FDE68A] bg-[#FEFCE8]">
                                <Clock className="h-4 w-4 text-[#A16207]" />
                                <AlertTitle className="font-semibold text-[#854D0E]">
                                    {t('certificationProgram.register.pendingPaymentAlert', 'Pembayaran Menunggu')}
                                </AlertTitle>
                                <AlertDescription className="space-y-3 text-[#854D0E]">
                                    <p>{t('certificationProgram.register.pendingInvoiceAlertDesc', 'Anda memiliki invoice yang belum dibayar.')}</p>
                                    <Button asChild size="lg" className="h-11 w-full sm:w-auto">
                                        <a href={pendingInvoiceUrl} target="_blank" rel="noopener noreferrer">
                                            {t('certificationProgram.register.btnContinuePayment', 'Lanjutkan Pembayaran')}
                                        </a>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        {requiresDocumentUpload && (
                            <Alert className="rounded-2xl border border-[#FDE68A] bg-[#FEFCE8]">
                                <Lock className="h-4 w-4 text-[#A16207]" />
                                <AlertTitle className="font-semibold text-[#854D0E]">
                                    {t('certificationProgram.register.docRequiredTitle', 'Dokumen Pendukung Diperlukan')}
                                </AlertTitle>
                                <AlertDescription className="space-y-3 text-[#854D0E]">
                                    <p>
                                        {program.document_description ??
                                            t(
                                                'certificationProgram.register.docRequiredDefaultDesc',
                                                'Program ini memerlukan dokumen pendukung sebelum pendaftaran diproses.',
                                            )}
                                    </p>
                                    {!documentStatus && (
                                        <Button
                                            type="button"
                                            size="sm"
                                            className="h-10 w-full sm:w-auto"
                                            variant="outline"
                                            onClick={() => handlePrimaryAction()}
                                        >
                                            {t('certificationProgram.register.btnUploadDoc', 'Upload Dokumen Pendukung')}
                                        </Button>
                                    )}
                                    {isDocumentPending && (
                                        <p className="font-medium">
                                            {t(
                                                'certificationProgram.register.docSentWaiting',
                                                'Dokumen sudah dikirim dan sedang menunggu verifikasi admin.',
                                            )}
                                        </p>
                                    )}
                                    {isDocumentRejected && (
                                        <div className="space-y-2">
                                            <p className="font-semibold text-[#B91C1C]">
                                                {t(
                                                    'certificationProgram.register.docRejectedNotice',
                                                    'Dokumen Anda ditolak. Silakan unggah ulang dokumen yang sesuai untuk diverifikasi kembali.',
                                                )}
                                            </p>
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-10 border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C] hover:bg-[#FEE2E2]"
                                                variant="outline"
                                                onClick={() => handlePrimaryAction()}
                                            >
                                                {t('certificationProgram.register.btnReuploadDoc', 'Unggah Ulang Dokumen')}
                                            </Button>
                                        </div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        )}

                        {showScholarshipWarning && (
                            <Alert className="rounded-2xl border border-[#FDE68A] bg-[#FEFCE8]">
                                <Lock className="h-4 w-4 text-[#A16207]" />
                                <AlertTitle className="font-semibold text-[#854D0E]">
                                    {t('certificationProgram.register.scholarshipRequiredTitle', 'Aplikasi Beasiswa Diperlukan')}
                                </AlertTitle>
                                <AlertDescription className="space-y-3 text-[#854D0E]">
                                    <p>
                                        {t(
                                            'certificationProgram.register.scholarshipRequiredDesc',
                                            'Silakan ajukan aplikasi beasiswa dan tunggu persetujuan admin.',
                                        )}
                                    </p>
                                    <Button asChild size="sm" variant="outline" className="h-10 border-[#F59E0B] bg-white text-[#854D0E] hover:bg-[#FEF3C7]">
                                        <Link href={route('certification-programs.scholarship-apply', program.slug)}>
                                            {t('certificationProgram.register.btnApplyScholarship', 'Ajukan Beasiswa')}
                                        </Link>
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-6">
                            <h3 className="font-literata mb-3 text-lg font-bold text-[#12344E]">
                                {t('certificationProgram.register.tabDetail', 'Detail Program')}
                            </h3>
                            <ul className="space-y-2.5 text-sm text-[#475569]">
                                {program.mentors.length > 0 && (
                                    <li className="flex items-start gap-2.5">
                                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                                        <span>Mentor: {program.mentors.map((m) => m.name).join(', ')}</span>
                                    </li>
                                )}
                                {program.schedules.length > 0 && (
                                    <li className="flex items-start gap-2.5">
                                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                                        <span>Mulai: {formatIndonesianDate(getDate(program.schedules[0]), i18n.language || 'id')}</span>
                                    </li>
                                )}
                                <li className="flex items-start gap-2.5">
                                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                                    <span>
                                        {t('certificationProgram.detail.hero.sessionsCount', 'Total {{count}} sesi pertemuan', {
                                            count: program.schedules.length,
                                        })}
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Right Column: Sticky Payment Summary */}
                    <div className={!pendingInvoiceUrl ? 'lg:sticky lg:top-24 lg:col-span-5' : 'lg:col-span-12'}>
                        <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm">
                            <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                <h2 className="font-literata text-lg font-bold text-[#12344E]">
                                    {t('certificationProgram.register.paymentDetailTitle', 'Ringkasan Pembayaran')}
                                </h2>
                            </div>
                            <div className="space-y-5 p-5 sm:p-6">
                                {/* Tab Pilihan Pembayaran (Full / Cicilan) */}
                                {((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) &&
                                    !isScholarship &&
                                    displayPrice > 0 && (
                                        <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-1">
                                            <button
                                                type="button"
                                                onClick={() => setPaymentMode('full')}
                                                disabled={!!activeInstallment && !activeInstallment.is_fully_paid}
                                                className={`min-h-10 rounded-lg text-xs font-semibold transition-colors ${
                                                    paymentMode === 'full' ? 'bg-white text-[#12344E] shadow-xs' : 'text-[#5B6B7F] hover:text-[#12344E]'
                                                } ${activeInstallment && !activeInstallment.is_fully_paid ? 'cursor-not-allowed opacity-50' : ''}`}
                                            >
                                                {t('certificationProgram.register.tabFull', 'Bayar Lunas (Full)')}
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
                                                {t('certificationProgram.register.tabInstallmentWithCount', 'Cicilan ({{count}}x)', {
                                                    count:
                                                        activeInstallment && !activeInstallment.is_fully_paid
                                                            ? activeInstallment.total_terms || activeInstallment.terms?.length
                                                            : installmentTerms.length,
                                                })}
                                            </button>
                                        </div>
                                    )}

                                {paymentMode === 'installment' &&
                                ((installmentTerms && installmentTerms.length > 0) || (activeInstallment && !activeInstallment.is_fully_paid)) &&
                                !isScholarship &&
                                displayPrice > 0 ? (
                                    <InstallmentOptions
                                        productType="certification_program"
                                        productId={program.id}
                                        productPrice={program.price}
                                        terms={installmentTerms}
                                        activeInstallment={activeInstallment}
                                        termsAccepted={termsAccepted}
                                        onTermsAcceptedChange={setTermsAccepted}
                                        onBeforePay={async () => {
                                            if (!activeInstallment && !termsAccepted) {
                                                toast.error(
                                                    t('certificationProgram.register.mustAgreeTerms', 'Anda harus menyetujui syarat dan ketentuan!'),
                                                );
                                                return false;
                                            }
                                            const authed = await ensureAuthenticated();
                                            setIsLoading(false);
                                            return authed;
                                        }}
                                    />
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
                                                            {t('certificationProgram.register.codeTypeLabel', 'Jenis Kode')}
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
                                                                    {t('certificationProgram.register.voucherTab', 'Voucher')}
                                                                </Label>
                                                            </div>
                                                            <div className="flex items-center space-x-2">
                                                                <RadioGroupItem value="referral" id="code-referral" />
                                                                <Label htmlFor="code-referral" className="cursor-pointer text-sm text-[#162230]">
                                                                    {t('certificationProgram.register.referralTab', 'Referral')}
                                                                </Label>
                                                            </div>
                                                        </RadioGroup>
                                                    </div>

                                                    <div className="space-y-1.5">
                                                        <Label htmlFor="promo-code" className="text-xs font-semibold text-[#162230]">
                                                            {codeType === 'voucher'
                                                                ? t('certificationProgram.register.voucherOrPromoCode', 'Kode Voucher / Promo')
                                                                : t('certificationProgram.register.referralCode', 'Kode Referral')}
                                                        </Label>
                                                        <div className="flex gap-2">
                                                            <div className="relative flex-1">
                                                                <Input
                                                                    id="promo-code"
                                                                    type="text"
                                                                    placeholder={
                                                                        codeType === 'voucher'
                                                                            ? t(
                                                                                  'certificationProgram.register.placeholderPromoCode',
                                                                                  'Masukkan kode promo',
                                                                              )
                                                                            : t(
                                                                                  'certificationProgram.register.placeholderReferralCode',
                                                                                  'Masukkan kode referral',
                                                                              )
                                                                    }
                                                                    value={promoCode}
                                                                    onChange={(event) => setPromoCode(event.target.value.toUpperCase())}
                                                                    className="pr-10"
                                                                />
                                                                {(promoLoading || referralLoading) && (
                                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                                        <Loader2 className="h-4 w-4 animate-spin text-[#1976D3]" />
                                                                    </div>
                                                                )}
                                                                {!(promoLoading || referralLoading) && promoCode && (
                                                                    <div className="absolute top-1/2 right-3 -translate-y-1/2">
                                                                        {codeType === 'voucher' ? (
                                                                            discountData?.valid ? (
                                                                                <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
                                                                            ) : promoError ? (
                                                                                <AlertCircle className="h-5 w-5 text-[#B91C1C]" />
                                                                            ) : null
                                                                        ) : referralData?.valid ? (
                                                                            <CheckCircle2 className="h-5 w-5 text-[#15803D]" />
                                                                        ) : referralError ? (
                                                                            <AlertCircle className="h-5 w-5 text-[#B91C1C]" />
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
                                                                            codeType === 'voucher'
                                                                                ? 'Masukkan kode promo terlebih dahulu'
                                                                                : 'Masukkan kode referral terlebih dahulu',
                                                                        );
                                                                        return;
                                                                    }
                                                                    if (codeType === 'voucher') {
                                                                        await validatePromoCode();
                                                                    } else {
                                                                        await validateReferralCode();
                                                                    }
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
                                                                    <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
                                                                    <p className="text-xs font-semibold text-[#15803D]">
                                                                        Promo "{discountData.discount_code.code}" diterapkan!
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
                                                                    <CheckCircle2 className="h-4 w-4 text-[#15803D]" />
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
                                                            {t('certificationProgram.register.pointsOption', 'Gunakan Reward Point')}
                                                        </Label>
                                                        <p className="text-xs text-[#475569]">
                                                            {t('certificationProgram.register.pointsAvailable', 'Anda memiliki {{points}} poin (Rp {{points}})', {
                                                                points: userPoints.toLocaleString('id-ID'),
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
                                                            {t('certificationProgram.register.pointsInputPlaceholder', 'Jumlah poin yang digunakan')}
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
                                                                {t('certificationProgram.register.btnUseMaxPoints', 'Maksimal')}
                                                            </Button>
                                                        </div>
                                                        {pointsError && <p className="text-xs font-medium text-[#B91C1C]">{pointsError}</p>}
                                                        {codeType === 'voucher' && !!discountData?.valid && (
                                                            <p className="text-xs text-[#A16207]">
                                                                Poin tidak dapat digunakan bersamaan dengan kode voucher.
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Price Breakdown */}
                                        <div className="space-y-2.5 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                            {!isScholarshipNotApproved &&
                                            typeof program.strikethrough_price === 'number' &&
                                            program.strikethrough_price > 0 ? (
                                                <>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#475569]">
                                                            {t('certificationProgram.register.originalPrice', 'Harga Normal')}
                                                        </span>
                                                        <span className="text-[#5B6B7F] line-through tabular-nums">
                                                            {formatRupiah(program.strikethrough_price)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-[#475569]">
                                                            {t('certificationProgram.register.discount', 'Diskon')}
                                                        </span>
                                                        <span className="font-semibold text-[#15803D] tabular-nums">
                                                            -{formatRupiah(program.strikethrough_price - displayPrice)}
                                                        </span>
                                                    </div>
                                                </>
                                            ) : null}

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-[#475569]">
                                                    {t('certificationProgram.register.programPrice', 'Harga Program')}
                                                </span>
                                                <span className="font-semibold text-[#162230] tabular-nums">{formatRupiah(displayPrice)}</span>
                                            </div>

                                            {discountData?.valid && codeType === 'voucher' && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[#475569]">
                                                        {t('certificationProgram.register.promoCodeBreakdown', 'Diskon Promo ({{code}})', {
                                                            code: discountData.discount_code.code,
                                                        })}
                                                    </span>
                                                    <span className="font-semibold text-[#15803D] tabular-nums">
                                                        -{formatRupiah(discountData.discount_amount)}
                                                    </span>
                                                </div>
                                            )}

                                            {pointsChecked && pointsToUse > 0 && !pointsError && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-[#475569]">
                                                        {t('certificationProgram.register.pointsUsed', 'Potongan Poin')}
                                                    </span>
                                                    <span className="font-semibold text-[#15803D] tabular-nums">
                                                        -{formatRupiah(pointsToUse)}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-[#475569]">
                                                    {t('certificationProgram.register.adminFee', 'Biaya Transaksi')}
                                                </span>
                                                <span className="font-medium text-[#162230] tabular-nums">{formatRupiah(adminFee)}</span>
                                            </div>

                                            <Separator className="bg-[#DCE3EC]" />

                                            <div className="flex items-center justify-between pt-1">
                                                <span className="font-semibold text-[#12344E]">
                                                    {t('certificationProgram.register.totalPayment', 'Total Pembayaran')}
                                                </span>
                                                <span className="font-literata text-2xl font-bold text-[#12344E] tabular-nums">
                                                    {formatRupiah(totalPrice)}
                                                </span>
                                            </div>
                                        </div>

                                        {deadline && (
                                            <div className="flex items-start gap-2.5 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5 text-sm">
                                                <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#1976D3]" />
                                                <div>
                                                    <p className="text-xs font-semibold text-[#5B6B7F]">
                                                        {t('certificationProgram.register.deadline', 'Batas Pendaftaran:')}
                                                    </p>
                                                    <p className="mt-0.5 text-sm font-medium text-[#12344E]">
                                                        {format(deadline, `dd MMMM yyyy '${atWord}' HH:mm`, { locale: dateLocale })} WIB
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {displayPrice > 0 && (
                                            <div className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                                <Checkbox
                                                    id="terms"
                                                    checked={termsAccepted}
                                                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                                                    className="mt-0.5"
                                                />
                                                <Label htmlFor="terms" className="cursor-pointer text-xs leading-relaxed text-[#475569] sm:text-sm">
                                                    {t('course.checkout.agreeToTerms', 'Saya menyetujui')}{' '}
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
                                                onClick={handlePrimaryAction}
                                                disabled={isPrimaryDisabled}
                                                className="h-12 w-full text-base font-semibold"
                                                size="lg"
                                            >
                                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                {isLoading
                                                    ? t('certificationProgram.register.processing', 'Memproses...')
                                                    : requiresDocumentUpload && !hasApprovedDocument && !isDocumentPending
                                                      ? isDocumentRejected
                                                          ? t('certificationProgram.register.btnReuploadDoc', 'Unggah Ulang Dokumen')
                                                          : t('certificationProgram.register.btnUploadDoc', 'Upload Dokumen Pendukung')
                                                      : t('certificationProgram.register.btnPayNow', 'Bayar Sekarang')}
                                            </Button>

                                            {disabledReason && <p className="text-center text-xs text-[#5B6B7F]">{disabledReason}</p>}
                                        </div>

                                        <div className="flex items-center justify-center gap-1.5 text-xs text-[#5B6B7F]">
                                            <Shield className="h-3.5 w-3.5 text-[#15803D]" />
                                            <span>{t('certificationProgram.detail.register.securePayment', 'Pembayaran aman dan terenkripsi SSL')}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Dialog open={isDocumentDialogOpen} onOpenChange={setIsDocumentDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="font-literata text-[#12344E]">
                            {t('certificationProgram.register.docDialogTitle', 'Upload Dokumen Pendukung')}
                        </DialogTitle>
                        <DialogDescription>
                            {program.document_description ??
                                t(
                                    'certificationProgram.register.docDialogDescription',
                                    'Unggah dokumen yang diminta agar admin dapat memverifikasi pendaftaran Anda.',
                                )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-xl border border-[#FDE68A] bg-[#FEFCE8] p-3.5 text-sm text-[#854D0E]">
                            <p className="font-semibold">{t('certificationProgram.register.docDialogAccepted', 'Format dokumen yang diterima')}</p>
                            <p className="mt-1 text-xs">
                                {t('certificationProgram.register.docDialogAcceptedFormats', 'PDF, JPG, JPEG, PNG, atau WebP. Maksimal 5 MB.')}
                            </p>
                        </div>
                        <Input type="file" accept=".pdf,image/*" onChange={(event) => setDocumentAttachment(event.target.files?.[0] ?? null)} />
                        {documentAttachment && (
                            <p className="text-sm text-[#475569]">
                                {t('certificationProgram.register.docDialogSelected', 'File terpilih: {{fileName}}', {
                                    fileName: documentAttachment.name,
                                })}
                            </p>
                        )}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setIsDocumentDialogOpen(false)}>
                            {t('certificationProgram.register.docDialogCancel', 'Batal')}
                        </Button>
                        <Button type="button" onClick={handleDocumentSubmit} disabled={isLoading || !documentAttachment}>
                            {t('certificationProgram.register.docDialogSubmit', 'Upload Dokumen')}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
