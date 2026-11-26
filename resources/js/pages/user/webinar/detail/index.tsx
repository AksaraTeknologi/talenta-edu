import { PosterPreviewDialog } from '@/components/poster-preview-dialog';
import { ProgramBadge } from '@/components/program-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { formatIndonesianDate, formatIndonesianTime, resolveStorageUrl } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { CalendarDays, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AboutSection from './about-section';
import RegisterSection from './register-section';
import RelatedProduct from './related-product';

interface Webinar {
    id: string;
    title: string;
    category?: { name: string };
    category_id?: string;
    tools?: { name: string; description?: string | null; icon: string | null }[];
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    start_time: string;
    end_time: string;
    registration_deadline: string;
    status: string;
    webinar_url: string;
    registration_url: string;
    thumbnail?: string | null;
    description?: string | null;
    benefits?: string | null;
    instructions?: string | null;
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
    created_at: string | Date;
}

interface RelatedWebinar {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    start_time: string;
    category?: {
        name: string;
    };
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

export default function Webinar({
    webinar,
    relatedWebinars,
    myWebinarIds,
    referralInfo,
}: {
    webinar: Webinar;
    relatedWebinars: RelatedWebinar[];
    myWebinarIds: string[];
    referralInfo: ReferralInfo;
}) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        }
    }, [referralInfo]);

    const deadline = new Date(webinar.registration_deadline);
    const isRegistrationOpen = new Date() < deadline;

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const startTimeStr = formatIndonesianTime(webinar.start_time, lang);
    const endTimeStr = formatIndonesianTime(webinar.end_time, lang);
    const timeLabel = startTimeStr === endTimeStr ? startTimeStr : `${startTimeStr.replace(' WIB', '')} – ${endTimeStr}`;

    return (
        <UserLayout>
            <Head title={`${webinar.title} - ${t('webinar.detail.titleSuffix', 'Webinar')}`} />

            <div className="w-full bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-16">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link href="/webinar" className="hover:text-[#1976D3]">
                            {t('webinar.title', 'Webinar')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1 text-[#162230]">{webinar.title}</span>
                    </nav>

                    {/* Unified 2-Column Sticky Layout */}
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Left Column */}
                        <div className="min-w-0 space-y-6">
                            {/* Header & Meta */}
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <ProgramBadge type="webinar" labelOverride={t('webinar.detail.badgeWebinar', 'Webinar')} />
                                    {webinar.category?.name && (
                                        <span className="rounded-md border border-[#DCE3EC] bg-white px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                                            {webinar.category.name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="font-literata text-2xl leading-tight font-bold text-[#12344E] sm:text-3xl">
                                    {webinar.title}
                                </h1>

                                {webinar.description && (
                                    <p className="text-sm leading-relaxed text-[#475569] sm:text-base">{webinar.description}</p>
                                )}

                                {/* Meta Row (Quota intentionally omitted here to avoid duplication with price card) */}
                                <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-1 text-sm font-medium text-[#162230]">
                                    <div className="flex items-center gap-2">
                                        <CalendarDays className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>{formatIndonesianDate(webinar.start_time, lang)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>{timeLabel}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>{t('webinar.detail.onlinePlatform', 'Google Meet/Zoom')}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Compact Poster with Zoom Modal */}
                            <PosterPreviewDialog src={resolveStorageUrl(webinar.thumbnail)} title={webinar.title} />

                            {/* Structured Text Content */}
                            <AboutSection webinar={webinar} />

                            {/* Mentor Card */}
                            {webinar.user && (
                                <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">
                                        {t('webinar.detail.webinarSpeaker', 'Pemateri Webinar')}
                                    </p>
                                    <Link
                                        href={`/mentor/${webinar.user.id}`}
                                        className="group flex items-center gap-4 rounded-xl transition-colors"
                                    >
                                        <Avatar className="h-14 w-14 shrink-0 border border-[#DCE3EC] bg-[#EAF3FC]">
                                            <AvatarImage
                                                src={resolveStorageUrl(webinar.user.avatar)}
                                                alt={webinar.user.name}
                                                className="object-cover"
                                            />
                                            <AvatarFallback className="bg-[#12344E] text-base font-bold text-white">
                                                {getInitials(webinar.user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-base font-semibold text-[#162230] transition-colors group-hover:text-[#1976D3] sm:text-lg">
                                                {webinar.user.name}
                                            </h3>
                                            {webinar.user.bio && (
                                                <p className="mt-0.5 line-clamp-2 text-sm text-[#475569]">{webinar.user.bio}</p>
                                            )}
                                        </div>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Right Column: Sticky Price Card */}
                        <div className="lg:sticky lg:top-24" id="register">
                            <RegisterSection webinar={webinar} />
                        </div>
                    </div>

                    {/* Related Webinars */}
                    <RelatedProduct relatedWebinars={relatedWebinars} myWebinarIds={myWebinarIds} />
                </div>
            </div>

            {/* Mobile Sticky Bottom CTA Bar */}
            <div className="fixed right-0 bottom-[68px] left-0 z-40 border-t border-[#DCE3EC] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#5B6B7F]">{t('webinar.detail.priceLabel', 'Biaya Pendaftaran')}</p>
                        <p className="truncate font-literata text-lg font-bold text-[#12344E] tabular-nums">
                            {webinar.price > 0 ? `Rp ${webinar.price.toLocaleString('id-ID')}` : t('webinar.detail.free', 'GRATIS')}
                        </p>
                    </div>
                    {isRegistrationOpen ? (
                        <Button className="h-11 shrink-0 px-5 font-semibold" asChild>
                            <Link href={webinar.registration_url}>{t('webinar.detail.btnJoinNow', 'Gabung Sekarang')}</Link>
                        </Button>
                    ) : (
                        <Button className="h-11 shrink-0 px-5" disabled>
                            {t('webinar.detail.registrationClosed', 'Pendaftaran Ditutup')}
                        </Button>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
