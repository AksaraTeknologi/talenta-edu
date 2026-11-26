import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { calculateDiscountPercent, formatIndonesianDate, formatIndonesianTime } from '@/lib/utils';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Clock, GraduationCap, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Mentor {
    id: string;
    name: string;
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

interface CertificationProgram {
    id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    type: 'regular' | 'scholarship';
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
    thumbnail?: string | null;
    category?: { name: string };
    batch?: string | null;
    mentors: Mentor[];
    schedules: Schedule[];
    document_required?: boolean;
    document_description?: string | null;
}

interface RegisterSectionProps {
    program: CertificationProgram;
    isEnrolled: boolean;
    scholarshipApplication?: { status: string } | null;
}

export default function RegisterSection({ program, isEnrolled, scholarshipApplication }: RegisterSectionProps) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';
    const { auth } = usePage<SharedData>().props;

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

    const formatRupiah = (amount: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);

    const getDate = (s: Schedule) => s.schedule_date || s.start_date || '';
    const discountPercent = !isScholarshipNotApproved ? calculateDiscountPercent(program.strikethrough_price, displayPrice) : 0;

    return (
        <div className="rounded-2xl border border-[#DCE3EC] bg-white p-6 shadow-md">
            <div className="mb-5">
                {!isScholarshipNotApproved &&
                discountPercent > 0 &&
                typeof program.strikethrough_price === 'number' &&
                program.strikethrough_price > 0 ? (
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-[#64748B] line-through tabular-nums">
                            {formatRupiah(program.strikethrough_price)}
                        </span>
                        <span className="rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                            {t('home:latest.save', { discount: discountPercent, defaultValue: `Hemat ${discountPercent}%` })}
                        </span>
                    </div>
                ) : null}

                {displayPrice > 0 ? (
                    <h2 className="font-literata text-3xl font-bold text-[#12344E] tabular-nums">{formatRupiah(displayPrice)}</h2>
                ) : (
                    <h2 className="font-literata text-3xl font-bold text-[#15803D]">
                        {t('certificationProgram.detail.register.free', 'GRATIS')}
                    </h2>
                )}

                {!isScholarshipNotApproved && program.type === 'scholarship' && program.scholarship_price !== undefined && program.scholarship_price > 0 && (
                    <p className="mt-1 text-xs font-semibold text-[#1976D3]">
                        {t('certificationProgram.detail.register.scholarshipPriceLabel', 'Harga Beasiswa')}
                    </p>
                )}
            </div>

            <div className="mb-5 space-y-3">
                {isEnrolled && (
                    <div className="rounded-xl border border-[#BBF7D0] bg-[#ECFDF3] p-3 text-center">
                        <p className="text-sm font-semibold text-[#15803D]">
                            {t('certificationProgram.detail.register.alreadyEnrolled', 'Anda sudah terdaftar di program ini')}
                        </p>
                    </div>
                )}

                {auth ? (
                    <>
                        {!isEnrolled && program.type === 'scholarship' && !isScholarshipApproved ? null : (
                            <Button asChild={canRegisterRegular} className="h-12 w-full rounded-lg text-base font-semibold" size="lg" disabled={!canRegisterRegular}>
                                {canRegisterRegular ? (
                                    <Link href={route('certification-programs.register', program.slug)}>
                                        {t('certificationProgram.detail.register.btnRegisterRegular', 'Daftar Program Reguler')}
                                    </Link>
                                ) : (
                                    <span>
                                        {isEnrolled
                                            ? t('certificationProgram.detail.register.btnEnrolled', 'Sudah Terdaftar')
                                            : t('certificationProgram.detail.register.btnRegularClosed', 'Pendaftaran Reguler Ditutup')}
                                    </span>
                                )}
                            </Button>
                        )}
                        {program.type === 'scholarship' && !isScholarshipApproved && (
                            <Button
                                asChild={canRegisterScholarship}
                                disabled={!canRegisterScholarship}
                                className="h-12 w-full rounded-lg text-base font-semibold"
                                size="lg"
                            >
                                {canRegisterScholarship ? (
                                    <Link href={route('certification-programs.register', { program: program.slug, scholarship: 1 })}>
                                        <GraduationCap className="h-5 w-5" />
                                        {t('certificationProgram.detail.register.btnApplyScholarship', 'Ajukan Beasiswa')}
                                    </Link>
                                ) : (
                                    <span>{t('certificationProgram.detail.register.btnScholarshipClosed', 'Pendaftaran Beasiswa Ditutup')}</span>
                                )}
                            </Button>
                        )}
                    </>
                ) : (
                    <Button asChild className="h-12 w-full rounded-lg text-base font-semibold" size="lg">
                        <Link href={route('certification-programs.register', program.slug)}>
                            {t('certificationProgram.detail.register.btnRegisterNow', 'Daftar Sekarang')}
                        </Link>
                    </Button>
                )}
            </div>

            <Separator className="mb-5 bg-[#DCE3EC]" />

            <div className="space-y-3 text-sm text-[#475569]">
                <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>{t('certificationProgram.detail.register.online', 'Online')}</span>
                </div>
                {program.batch && (
                    <div className="flex items-start gap-3">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                        <span>{t('certificationProgram.detail.hero.batch', 'Batch {{batch}}', { batch: program.batch })}</span>
                    </div>
                )}
            </div>

            {program.document_required && (
                <div className="mt-4 rounded-xl border border-[#FDE68A] bg-[#FEFCE8] p-3.5 text-sm text-[#854D0E]">
                    <p className="font-semibold">{t('certificationProgram.detail.register.docRequiredTitle', 'Dokumen Pendukung Wajib')}</p>
                    <p className="mt-1 whitespace-pre-line text-xs leading-relaxed">
                        {program.document_description ??
                            t('certificationProgram.detail.register.docRequiredDefault', 'Peserta wajib mengunggah dokumen pendukung.')}
                    </p>
                </div>
            )}

            {program.schedules && program.schedules.length > 0 && (
                <>
                    <Separator className="my-5 bg-[#DCE3EC]" />
                    <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#5B6B7F]">
                            {t('certificationProgram.detail.register.scheduleLabel', 'Jadwal Pelaksanaan')}
                        </p>
                        <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                            {program.schedules.map((schedule, idx) => {
                                const dateValue = getDate(schedule);
                                return (
                                    <div key={idx} className="flex items-start gap-2 rounded-lg border border-[#DCE3EC] bg-[#FAF8F4] px-3 py-2 text-xs text-[#475569]">
                                        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1976D3]" />
                                        <p className="capitalize">
                                            {schedule.title ||
                                                t('certificationProgram.detail.schedule.sessionPrefix', 'Sesi {{index}}', { index: idx + 1 })}{' '}
                                            {dateValue ? `| ${formatIndonesianDate(dateValue, lang)}` : ''}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}

            {(scholarshipDeadline || regularDeadline) && (
                <>
                    <Separator className="my-5 bg-[#DCE3EC]" />
                    <div className="rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-3.5">
                        {program.type === 'scholarship' && scholarshipDeadline ? (
                            <>
                                <p className="text-xs font-semibold text-[#5B6B7F]">
                                    {t('certificationProgram.detail.register.scholarshipDeadline', 'Batas Pengisian Form Beasiswa:')}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#12344E]">
                                    {formatIndonesianDate(scholarshipDeadline, lang)} • {formatIndonesianTime(scholarshipDeadline, lang)}
                                </p>
                            </>
                        ) : regularDeadline ? (
                            <>
                                <p className="text-xs font-semibold text-[#5B6B7F]">
                                    {t('certificationProgram.detail.register.regularDeadline', 'Batas Pendaftaran Program:')}
                                </p>
                                <p className="mt-1 text-sm font-semibold text-[#12344E]">
                                    {formatIndonesianDate(regularDeadline, lang)} • {formatIndonesianTime(regularDeadline, lang)}
                                </p>
                            </>
                        ) : null}
                    </div>
                </>
            )}
        </div>
    );
}
