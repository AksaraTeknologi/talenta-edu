import { Reveal } from '@/components/home-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
    total_courses: number;
    total_articles: number;
    total_webinars: number;
    total_bootcamps: number;
}

interface MentorIndexProps {
    mentors: Mentor[];
}

export default function MentorIndex({ mentors }: MentorIndexProps) {
    const { t } = useTranslation(['user', 'common']);
    const getInitials = useInitials();

    const sum = (key: keyof Pick<Mentor, 'total_courses' | 'total_bootcamps' | 'total_articles'>) => mentors.reduce((acc, m) => acc + (m[key] || 0), 0);

    const stats = [
        { value: mentors.length, label: t('mentor.activeMentors') },
        { value: sum('total_courses'), label: t('mentor.totalCourses') },
        { value: sum('total_bootcamps'), label: t('mentor.totalBootcamps') },
        { value: sum('total_articles'), label: t('mentor.totalArticles') },
    ];

    return (
        <UserLayout>
            <Head title={t('mentor.headTitle')} />

            {/* Header */}
            <section className="w-full border-b border-[#E7E2D8] bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 sm:pb-14 lg:px-8">
                    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:mb-8 sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[#162230]">{t('mentor.headTitle')}</span>
                    </nav>

                    <Reveal immediate y={14} delay={0.04} duration={0.5}>
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-3.5 py-1 text-xs font-semibold text-[#B8470A] sm:text-sm">
                            <span className="h-2 w-2 rounded-full bg-[#D95B16]" aria-hidden="true" />
                            <span>{t('mentor.proBadge')}</span>
                        </div>
                    </Reveal>

                    <Reveal immediate y={22} delay={0.1} duration={0.6}>
                        <h1 className="font-literata max-w-3xl text-[30px] leading-[1.15] font-bold tracking-tight text-[#12344E] sm:text-4xl lg:text-[44px]">
                            {t('mentor.heroTitle1')} <span className="text-[#1976D3]">{t('mentor.heroHighlight')}</span> {t('mentor.heroTitle2')}
                        </h1>
                    </Reveal>

                    <Reveal immediate y={18} delay={0.18} duration={0.6}>
                        <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-[#475569] sm:text-[17px]">{t('mentor.heroDesc')}</p>
                    </Reveal>

                    <Reveal y={20} delay={0.26} duration={0.6}>
                        <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#DCE3EC] shadow-xs sm:mt-10 lg:grid-cols-4">
                            {stats.map((stat) => (
                                <div key={stat.label} className="flex flex-col-reverse justify-center bg-white px-5 py-4 sm:px-6 sm:py-5">
                                    <dt className="mt-1 text-xs font-medium text-[#475569] sm:text-sm">{stat.label}</dt>
                                    <dd className="font-literata text-2xl font-bold text-[#12344E] tabular-nums sm:text-3xl">{stat.value}</dd>
                                </div>
                            ))}
                        </dl>
                    </Reveal>
                </div>
            </section>

            {/* Mentors grid */}
            <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
                {mentors.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {mentors.map((mentor, idx) => {
                            const counts = [
                                { value: mentor.total_courses, label: t('mentor.onlineCourse') },
                                { value: mentor.total_bootcamps, label: t('mentor.stats.bootcamps') },
                                { value: mentor.total_articles, label: t('mentor.stats.articles') },
                            ];

                            return (
                                <Reveal key={mentor.id} y={24} delay={Math.min(idx * 0.06, 0.36)} className="h-full">
                                    <Link
                                        href={`/mentor/${mentor.id}`}
                                        className="group flex h-full flex-col rounded-xl border border-[#DCE3EC] bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#93C5FD] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1976D3] focus-visible:ring-offset-2 focus-visible:outline-none sm:p-6"
                                    >
                                        <div className="flex items-start gap-4">
                                            <Avatar className="h-16 w-16 shrink-0 border border-[#DCE3EC]">
                                                <AvatarImage src={mentor.avatar} alt={mentor.name} className="object-cover" />
                                                <AvatarFallback className="bg-[#EAF3FC] text-lg font-semibold text-[#12344E]">{getInitials(mentor.name)}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <h2 className="text-base leading-snug font-semibold text-[#162230] transition-colors group-hover:text-[#1976D3]">
                                                    {mentor.name}
                                                </h2>
                                                <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[#5B6B7F]">{mentor.bio || t('mentor.defaultBio')}</p>
                                            </div>
                                        </div>

                                        <dl className="mt-5 grid grid-cols-3 divide-x divide-[#EEF2F6] rounded-lg border border-[#EEF2F6] bg-[#FAF8F4] py-3 text-center">
                                            {counts.map((c) => (
                                                <div key={c.label} className="flex flex-col-reverse px-2">
                                                    <dt className="mt-0.5 truncate text-[11px] font-medium text-[#5B6B7F] sm:text-xs">{c.label}</dt>
                                                    <dd className="text-lg font-bold text-[#12344E] tabular-nums">{c.value}</dd>
                                                </div>
                                            ))}
                                        </dl>

                                        <span className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-[#1976D3]">
                                            {t('mentor.viewProfile')}
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    </Link>
                                </Reveal>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] px-6 py-16 text-center">
                        <h2 className="font-literata text-xl font-bold text-[#12344E]">{t('mentor.noMentors')}</h2>
                        <p className="max-w-md text-sm text-[#475569]">{t('mentor.noMentorsDesc2')}</p>
                        <Button variant="outline" asChild className="mt-2">
                            <Link href="/">{t('mentor.backHome')}</Link>
                        </Button>
                    </div>
                )}
            </section>
        </UserLayout>
    );
}
