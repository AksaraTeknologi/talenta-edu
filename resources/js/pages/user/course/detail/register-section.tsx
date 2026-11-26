import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { calculateDiscountPercent } from '@/lib/utils';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { BadgeCheck, BookOpen, FileText, MessageCircle, Monitor } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Course {
    slug?: string;
    title: string;
    thumbnail?: string | null;
    strikethrough_price: number;
    short_description?: string | null;
    user?: { id: string; name: string; bio: string | null };
    price: number;
    registration_url: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            video_url?: string | null;
        }[];
    }[];
}

export default function RegisterSection({ course }: { course: Course }) {
    const { t } = useTranslation('user');
    const { auth } = usePage<SharedData>().props;
    const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;

    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number;

    const currentHref = typeof window !== 'undefined' ? window.location.href : '';
    let registrationUrl: string;
    let buttonText: string;
    let warningMessage: string | null = null;

    if (!isLoggedIn) {
        registrationUrl = course.slug ? `/course/${course.slug}/checkout` : course.registration_url;
        buttonText = t('course.detail.btnBuyNow', 'Beli Sekarang');
        warningMessage = null;
    } else if (!isProfileComplete) {
        registrationUrl = route('profile.edit', { redirect: currentHref });
        buttonText = t('course.detail.btnCompleteProfile', 'Lengkapi Profil untuk Mendaftar');
        warningMessage = t('course.detail.warningProfile', 'Profil Anda belum lengkap!');
    } else {
        registrationUrl = course.slug ? `/course/${course.slug}/checkout` : course.registration_url;
        buttonText = t('course.detail.btnBuyNow', 'Beli Sekarang');
        warningMessage = null;
    }

    const discountPercent = calculateDiscountPercent(course.strikethrough_price, course.price);

    return (
        <div className="rounded-2xl border border-[#DCE3EC] bg-white p-6 shadow-md">
            <div className="mb-5">
                {discountPercent > 0 && course.strikethrough_price > 0 && (
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-[#64748B] line-through tabular-nums">
                            Rp {course.strikethrough_price.toLocaleString('id-ID')}
                        </span>
                        <span className="rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                            {t('home:latest.save', { discount: discountPercent, defaultValue: `Hemat ${discountPercent}%` })}
                        </span>
                    </div>
                )}

                {course.price > 0 ? (
                    <h2 className="font-literata text-3xl font-bold text-[#12344E] tabular-nums">
                        Rp {course.price.toLocaleString('id-ID')}
                    </h2>
                ) : (
                    <h2 className="font-literata text-3xl font-bold text-[#15803D]">{t('course.detail.free', 'GRATIS')}</h2>
                )}
            </div>

            {warningMessage && (
                <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-3 text-center">
                    <p className="text-xs font-medium text-[#B91C1C] sm:text-sm">{warningMessage}</p>
                </div>
            )}

            <Button className="mb-5 h-12 w-full rounded-lg text-base font-semibold" size="lg" asChild>
                <Link href={registrationUrl}>{buttonText}</Link>
            </Button>

            <Separator className="mb-5 bg-[#DCE3EC]" />

            <div className="space-y-3 text-sm text-[#475569]">
                <div className="flex items-start gap-3">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>
                        {totalLessons} {t('course.detail.benefitModules', 'modul pembelajaran')}
                    </span>
                </div>
                <div className="flex items-start gap-3">
                    <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                    <span>{t('course.detail.benefitLifetime', 'Akses selamanya')}</span>
                </div>
                <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>{t('course.detail.benefitGroup', 'Grup diskusi aktif')}</span>
                </div>
                <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>{t('course.detail.benefitEmodul', 'E-modul')}</span>
                </div>
                <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>{t('course.detail.benefitCert', 'E-Sertifikat')}</span>
                </div>
                <div className="flex items-start gap-3">
                    <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>{t('course.detail.benefitDevices', 'Dapat diakses di komputer, laptop, dan mobile')}</span>
                </div>
            </div>
        </div>
    );
}
