import { PosterPreviewDialog } from '@/components/poster-preview-dialog';
import { ProgramBadge } from '@/components/program-badge';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { formatIndonesianDate, resolveStorageUrl } from '@/lib/utils';
import { SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';
import { CalendarDays, ChevronRight, GraduationCap, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AboutSection from './about-section';
import MentorSection from './mentor-section';
import RegisterSection from './register-section';
import RelatedPrograms from './related-programs';
import ScheduleInfoSection from './schedule-info-section';

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

interface Schedule {
    id: string;
    title?: string | null;
    schedule_date?: string;
    start_date?: string;
    day?: string;
    start_time?: string;
    end_time?: string;
}

interface Program {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    description: string;
    benefits: string;
    terms_conditions?: string | null;
    scholarship_flow?: string | null;
    type: 'regular' | 'scholarship';
    status: string;
    category: { id: string; name: string };
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
    group_url?: string;
    batch?: string;
    document_required?: boolean;
    document_description?: string | null;
    schedules: Schedule[];
    socializationSchedules: Schedule[];
    mentors: Mentor[];
}

interface RelatedProgram {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    price: number;
    strikethrough_price?: number;
    category?: { name: string };
    thumbnail?: string | null;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
}

interface DetailProps {
    program: Program;
    relatedPrograms: RelatedProgram[];
    myProgramIds: string[];
    scholarshipApplication?: { status: string } | null;
    approvedScholarshipProgramIds?: string[];
}

export default function Detail({ program, relatedPrograms, myProgramIds, scholarshipApplication, approvedScholarshipProgramIds = [] }: DetailProps) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';
    const { auth } = usePage<SharedData>().props;
    const isEnrolled = myProgramIds.includes(program.id);

    const getDate = (s: Schedule) => s.schedule_date || s.start_date || '';
    const firstSchedule = program.schedules.length > 0 ? getDate(program.schedules[0]) : null;
    const lastSchedule = program.schedules.length > 0 ? getDate(program.schedules[program.schedules.length - 1]) : null;

    const regularDeadline = program.registration_deadline ? new Date(program.registration_deadline) : null;
    const isRegularRegistrationOpen = regularDeadline ? new Date() < regularDeadline : true;
    const isScholarshipApproved = program.type === 'scholarship' ? scholarshipApplication?.status === 'approved' : true;
    const isScholarshipNotApproved = program.type === 'scholarship' && !isScholarshipApproved;
    const canRegisterRegular = isRegularRegistrationOpen && !isEnrolled && isScholarshipApproved;

    const scholarshipDeadline = program.socialization_registration_deadline ? new Date(program.socialization_registration_deadline) : null;
    const isScholarshipRegistrationOpen = scholarshipDeadline ? new Date() < scholarshipDeadline : true;
    const canRegisterScholarship = isScholarshipRegistrationOpen && !isEnrolled;

    const displayPrice = isScholarshipNotApproved
        ? 0
        : program.type === 'scholarship'
          ? (program.scholarship_price ?? program.price)
          : program.price;

    return (
        <UserLayout>
            <Head title={t('certificationProgram.detail.headTitle', '{{title}} - Program Sertifikasi', { title: program.title })} />

            <div className="w-full bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-16">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link href="/certification-program" className="hover:text-[#1976D3]">
                            {t('certificationProgram.dashboard.headTitle', 'Program Sertifikasi')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1 text-[#162230]">{program.title}</span>
                    </nav>

                    {/* Unified 2-Column Sticky Layout */}
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Left Column */}
                        <div className="min-w-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <ProgramBadge
                                        type="certification-program"
                                        labelOverride={
                                            program.type === 'scholarship'
                                                ? t('certificationProgram.detail.hero.badgeScholarship', 'Sertifikasi Beasiswa')
                                                : t('certificationProgram.detail.hero.badgeRegular', 'Program Sertifikasi')
                                        }
                                    />
                                    {program.category?.name && (
                                        <span className="rounded-md border border-[#DCE3EC] bg-white px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                                            {program.category.name}
                                        </span>
                                    )}
                                </div>

                                <h1 className="font-literata text-2xl leading-tight font-bold text-[#12344E] sm:text-3xl">
                                    {program.title}
                                </h1>

                                <p className="text-sm leading-relaxed text-[#475569] sm:text-base">
                                    {program.short_description ||
                                        t(
                                            'certificationProgram.detail.register.subtitle',
                                            'Daftar sekarang dan tingkatkan kompetensi profesional Anda melalui program sertifikasi bersama para ahli.',
                                        )}
                                </p>

                                <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-1 text-sm font-medium text-[#162230]">
                                    {firstSchedule && lastSchedule && (
                                        <div className="flex items-center gap-2">
                                            <CalendarDays className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                            <span>
                                                {formatIndonesianDate(firstSchedule, lang)} – {formatIndonesianDate(lastSchedule, lang)}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <GraduationCap className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>
                                            {t('certificationProgram.detail.hero.sessionsCount', '{{count}} Pertemuan', {
                                                count: program.schedules.length,
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>{t('certificationProgram.detail.register.online', 'Online')}</span>
                                    </div>
                                </div>
                            </div>

                            <PosterPreviewDialog src={resolveStorageUrl(program.thumbnail)} title={program.title} />

                            <AboutSection program={program} />

                            <ScheduleInfoSection program={program} />

                            <MentorSection program={program} />
                        </div>

                        {/* Right Column: Sticky Price Card */}
                        <div className="lg:sticky lg:top-24" id="register">
                            <RegisterSection program={program} isEnrolled={isEnrolled} scholarshipApplication={scholarshipApplication} />
                        </div>
                    </div>

                    <RelatedPrograms
                        relatedPrograms={relatedPrograms}
                        myProgramIds={myProgramIds}
                        approvedScholarshipProgramIds={approvedScholarshipProgramIds}
                    />
                </div>
            </div>

            {/* Mobile Sticky Bottom CTA Bar */}
            <div className="fixed right-0 bottom-[68px] left-0 z-40 border-t border-[#DCE3EC] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#5B6B7F]">{t('certificationProgram.detail.register.priceLabel', 'Biaya Program')}</p>
                        <p className="truncate font-literata text-lg font-bold text-[#12344E] tabular-nums">
                            {displayPrice > 0
                                ? `Rp ${displayPrice.toLocaleString('id-ID')}`
                                : t('certificationProgram.detail.register.free', 'GRATIS')}
                        </p>
                    </div>
                    {auth && program.type === 'scholarship' && !isScholarshipApproved ? (
                        <Button className="h-11 shrink-0 px-5 font-semibold" asChild={canRegisterScholarship} disabled={!canRegisterScholarship}>
                            {canRegisterScholarship ? (
                                <Link href={route('certification-programs.register', { program: program.slug, scholarship: 1 })}>
                                    {t('certificationProgram.detail.register.btnApplyScholarship', 'Ajukan Beasiswa')}
                                </Link>
                            ) : (
                                <span>{t('certificationProgram.detail.register.btnScholarshipClosed', 'Pendaftaran Beasiswa Ditutup')}</span>
                            )}
                        </Button>
                    ) : (
                        <Button className="h-11 shrink-0 px-5 font-semibold" asChild={canRegisterRegular} disabled={!canRegisterRegular}>
                            {canRegisterRegular ? (
                                <Link href={route('certification-programs.register', program.slug)}>
                                    {t('certificationProgram.detail.register.btnRegisterRegular', 'Daftar Program')}
                                </Link>
                            ) : (
                                <span>
                                    {isEnrolled
                                        ? t('certificationProgram.detail.register.btnEnrolled', 'Sudah Terdaftar')
                                        : t('certificationProgram.detail.register.btnRegularClosed', 'Pendaftaran Ditutup')}
                                </span>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
