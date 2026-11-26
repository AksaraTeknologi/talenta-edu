import { PosterPreviewDialog } from '@/components/poster-preview-dialog';
import { ProgramBadge } from '@/components/program-badge';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { formatIndonesianDate, resolveStorageUrl } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChartArea, ChevronRight, MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AboutSection from './about-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';
import RelatedProduct from './related-product';

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

interface Bootcamp {
    id: string;
    title: string;
    category?: { name: string };
    category_id?: string;
    schedules?: { schedule_date: string; day: string; start_time: string; end_time: string }[];
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_date: string;
    end_date: string;
    registration_deadline: string;
    status: string;
    bootcamp_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    instructions?: string | null;
    requirements?: string | null;
    curriculum?: string | null;
    mentors?: Mentor[];
    user?: Mentor;
    created_at: string | Date;
}

interface RelatedBootcamp {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    start_date: string;
    end_date: string;
    category?: {
        name: string;
    };
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

export default function Bootcamp({
    bootcamp,
    relatedBootcamps,
    myBootcampIds,
    referralInfo,
}: {
    bootcamp: Bootcamp;
    relatedBootcamps: RelatedBootcamp[];
    myBootcampIds: string[];
    referralInfo: ReferralInfo;
}) {
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        }
    }, [referralInfo]);

    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';

    const start = new Date(bootcamp.start_date);
    const end = new Date(bootcamp.end_date);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (24 * 60 * 60 * 1000)) + 1;
    const totalWeeks = Math.ceil(diffDays / 7);

    const deadline = new Date(bootcamp.registration_deadline);
    const isRegistrationOpen = new Date() < deadline;

    return (
        <UserLayout>
            <Head title={t('bootcamp.detail.headTitle', { title: bootcamp.title, defaultValue: `${bootcamp.title} - Bootcamp` })} />

            <div className="w-full bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-16">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link href="/bootcamp" className="hover:text-[#1976D3]">
                            {t('bootcamp.title', 'Bootcamp')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1 text-[#162230]">{bootcamp.title}</span>
                    </nav>

                    {/* Unified 2-Column Sticky Layout */}
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Left Column */}
                        <div className="min-w-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <ProgramBadge type="bootcamp" labelOverride={t('bootcamp.detail.intensiveBadge', 'Bootcamp Online')} />
                                    {bootcamp.category?.name && (
                                        <span className="rounded-md border border-[#DCE3EC] bg-white px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                                            {bootcamp.category.name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="font-literata text-2xl leading-tight font-bold text-[#12344E] sm:text-3xl">
                                    {bootcamp.title}
                                </h1>

                                <p className="text-sm leading-relaxed text-[#475569] sm:text-base">
                                    {bootcamp.description ||
                                        t(
                                            'bootcamp.detail.locationScheduleSubtitle',
                                            'Daftar sekarang dan dapatkan bimbingan dari mentor ahli dan akses materi pembelajaran yang lengkap.',
                                        )}
                                </p>

                                {/* Meta Row (Quota displayed only in price card) */}
                                <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-1 text-sm font-medium text-[#162230]">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>
                                            {formatIndonesianDate(bootcamp.start_date, lang)} – {formatIndonesianDate(bootcamp.end_date, lang)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <ChartArea className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>
                                            {diffDays < 7
                                                ? t('bootcamp.detail.daysCount', { count: diffDays, defaultValue: `${diffDays} Hari` })
                                                : t('bootcamp.detail.weeksCount', { count: totalWeeks, defaultValue: `${totalWeeks} Minggu` })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>{t('bootcamp.detail.online', 'Online')}</span>
                                    </div>
                                </div>
                            </div>

                            <PosterPreviewDialog src={resolveStorageUrl(bootcamp.thumbnail)} title={bootcamp.title} />

                            <AboutSection bootcamp={bootcamp} />

                            <MentorSection bootcamp={bootcamp} />
                        </div>

                        {/* Right Column: Sticky Price Card */}
                        <div className="lg:sticky lg:top-24" id="register">
                            <RegisterSection bootcamp={bootcamp} />
                        </div>
                    </div>

                    <RelatedProduct relatedBootcamps={relatedBootcamps} myBootcampIds={myBootcampIds} />
                </div>
            </div>

            {/* Mobile Sticky Bottom CTA Bar */}
            <div className="fixed right-0 bottom-[68px] left-0 z-40 border-t border-[#DCE3EC] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#5B6B7F]">{t('bootcamp.detail.priceLabel', 'Biaya Pendaftaran')}</p>
                        <p className="truncate font-literata text-lg font-bold text-[#12344E] tabular-nums">
                            {bootcamp.price > 0 ? `Rp ${bootcamp.price.toLocaleString('id-ID')}` : t('bootcamp.detail.free', 'GRATIS')}
                        </p>
                    </div>
                    {isRegistrationOpen ? (
                        <Button className="h-11 shrink-0 px-5 font-semibold" asChild>
                            <Link href={bootcamp.registration_url}>{t('bootcamp.detail.btnRegisterNow', 'Daftar Sekarang')}</Link>
                        </Button>
                    ) : (
                        <Button className="h-11 shrink-0 px-5" disabled>
                            {t('bootcamp.detail.registrationClosed', 'Pendaftaran Ditutup')}
                        </Button>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
