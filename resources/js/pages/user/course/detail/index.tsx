import { PosterPreviewDialog } from '@/components/poster-preview-dialog';
import { ProgramBadge } from '@/components/program-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import UserLayout from '@/layouts/user-layout';
import { formatIndonesianDate, resolveStorageUrl } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { BookOpen, Calendar, ChartBar, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AboutSection from './about-section';
import RegisterSection from './register-section';
import RelatedProduct from './related-product';

interface Course {
    id: string;
    slug: string;
    title: string;
    user?: { id: string; name: string; bio: string | null; avatar?: string | null };
    category?: { name: string };
    category_id?: string;
    tools?: { name: string; description?: string | null; icon: string | null }[];
    images?: { image_url: string }[];
    short_description?: string | null;
    description?: string | null;
    key_points?: string | null;
    strikethrough_price: number;
    price: number;
    thumbnail?: string | null;
    course_url: string;
    registration_url: string;
    status: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    created_at: string;
    updated_at: string;
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

interface RelatedCourse {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category?: {
        name: string;
    };
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

export default function DetailCourse({
    course,
    relatedCourses,
    myCourseIds,
    referralInfo,
}: {
    course: Course;
    relatedCourses: RelatedCourse[];
    myCourseIds: string[];
    referralInfo: ReferralInfo;
}) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';
    const { auth } = usePage<SharedData>().props;
    const getInitials = useInitials();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('affiliate_code', refFromUrl);
        }
    }, [referralInfo]);

    const totalLessons = course.modules?.reduce((total, module) => total + (module.lessons?.length || 0), 0) || 0;
    const isLoggedIn = !!auth.user;
    const isProfileComplete = isLoggedIn && auth.user?.phone_number;

    const currentHref = typeof window !== 'undefined' ? window.location.href : '';
    const registrationUrl =
        isLoggedIn && !isProfileComplete
            ? route('profile.edit', { redirect: currentHref })
            : course.slug
              ? `/course/${course.slug}/checkout`
              : course.registration_url;

    const buttonText =
        isLoggedIn && !isProfileComplete
            ? t('course.detail.btnCompleteProfile', 'Lengkapi Profil untuk Mendaftar')
            : t('course.detail.btnBuyNow', 'Beli Sekarang');

    return (
        <UserLayout>
            <Head title={`${course.title} - ${t('course.title', 'Kelas Online')}`} />

            <div className="w-full bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-16">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link href="/course" className="hover:text-[#1976D3]">
                            {t('course.title', 'Kelas Online')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1 text-[#162230]">{course.title}</span>
                    </nav>

                    {/* Unified 2-Column Sticky Layout */}
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Left Column */}
                        <div className="min-w-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <ProgramBadge type="course" labelOverride={t('course.detail.badge', 'Kelas Online')} />
                                    {course.category?.name && (
                                        <span className="rounded-md border border-[#DCE3EC] bg-white px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                                            {course.category.name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="font-literata text-2xl leading-tight font-bold text-[#12344E] sm:text-3xl">
                                    {course.title}
                                </h1>

                                {course.short_description && (
                                    <p className="text-sm leading-relaxed text-[#475569] sm:text-base">{course.short_description}</p>
                                )}

                                <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-1 text-sm font-medium text-[#162230]">
                                    <div className="flex items-center gap-2">
                                        <ChartBar className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span className="capitalize">{course.level}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <BookOpen className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>
                                            {totalLessons} {t('course.detail.benefitModules', 'modul pembelajaran')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>{formatIndonesianDate(course.created_at, lang)}</span>
                                    </div>
                                </div>
                            </div>

                            <PosterPreviewDialog src={resolveStorageUrl(course.thumbnail)} title={course.title} />

                            <AboutSection course={course} />

                            {/* Instructor Card */}
                            {course.user && (
                                <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6">
                                    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#5B6B7F]">
                                        {t('course.detail.professionalInstructor', 'Instruktur Kelas')}
                                    </p>
                                    {course.user.name === 'Admin' ? (
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-14 w-14 shrink-0 border border-[#DCE3EC] bg-[#EAF3FC]">
                                                <AvatarImage src={resolveStorageUrl(course.user.avatar)} alt={course.user.name} className="object-cover" />
                                                <AvatarFallback className="bg-[#12344E] text-base font-bold text-white">
                                                    {getInitials(course.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-semibold text-[#162230]">{course.user.name}</h3>
                                                {course.user.bio && <p className="mt-0.5 text-sm text-[#475569]">{course.user.bio}</p>}
                                            </div>
                                        </div>
                                    ) : (
                                        <Link href={`/mentor/${course.user.id}`} className="group flex items-center gap-4">
                                            <Avatar className="h-14 w-14 shrink-0 border border-[#DCE3EC] bg-[#EAF3FC]">
                                                <AvatarImage src={resolveStorageUrl(course.user.avatar)} alt={course.user.name} className="object-cover" />
                                                <AvatarFallback className="bg-[#12344E] text-base font-bold text-white">
                                                    {getInitials(course.user.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-semibold text-[#162230] transition-colors group-hover:text-[#1976D3]">
                                                    {course.user.name}
                                                </h3>
                                                {course.user.bio && (
                                                    <p className="mt-0.5 line-clamp-2 text-sm text-[#475569]">{course.user.bio}</p>
                                                )}
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Right Column: Sticky Price Card */}
                        <div className="lg:sticky lg:top-24" id="register">
                            <RegisterSection course={course} />
                        </div>
                    </div>

                    <RelatedProduct relatedCourses={relatedCourses} myCourseIds={myCourseIds} />
                </div>
            </div>

            {/* Mobile Sticky Bottom CTA Bar */}
            <div className="fixed right-0 bottom-[68px] left-0 z-40 border-t border-[#DCE3EC] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#5B6B7F]">{t('course.detail.priceLabel', 'Harga Kelas')}</p>
                        <p className="truncate font-literata text-lg font-bold text-[#12344E] tabular-nums">
                            {course.price > 0 ? `Rp ${course.price.toLocaleString('id-ID')}` : t('course.detail.free', 'GRATIS')}
                        </p>
                    </div>
                    <Button className="h-11 shrink-0 px-5 font-semibold" asChild>
                        <Link href={registrationUrl}>{buttonText}</Link>
                    </Button>
                </div>
            </div>
        </UserLayout>
    );
}
