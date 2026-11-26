import { formatIndonesianDate } from '@/lib/utils';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    schedules: Schedule[];
    socializationSchedules?: Schedule[];
    type: 'regular' | 'scholarship';
}

export default function ScheduleInfoSection({ program }: { program: CertificationProgram }) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';
    const dateLocale = lang.startsWith('en') ? enUS : id;
    const schedules = program.schedules ?? [];
    const socializationSchedules =
        program.socializationSchedules ?? (program as CertificationProgram & { socialization_schedules?: Schedule[] }).socialization_schedules ?? [];

    if (schedules.length === 0 && socializationSchedules.length === 0) return null;

    const getDate = (s: Schedule) => s.schedule_date || s.start_date || '';
    const getDayLabel = (s: Schedule) => {
        if (s.day?.trim()) return s.day;
        const dateValue = getDate(s);
        if (!dateValue) return '';
        return format(new Date(dateValue), 'EEEE', { locale: dateLocale });
    };

    const formatTime = (value?: string) => (value ? value.slice(0, 5).replace(':', lang.startsWith('en') ? ':' : '.') : '');

    return (
        <section className="space-y-6 rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6" id="schedules">
            {schedules.length > 0 && (
                <div>
                    <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                        {t('certificationProgram.detail.schedule.badge', 'Jadwal Pelaksanaan')}
                    </h2>
                    <p className="mt-1 mb-5 text-sm text-[#5B6B7F]">
                        {t('certificationProgram.detail.schedule.sessionSubtitle', 'Rangkaian sesi program yang akan dilaksanakan')}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {schedules.map((schedule, index) => {
                            const dateValue = getDate(schedule);
                            const startTime = formatTime(schedule.start_time);
                            const endTime = formatTime(schedule.end_time);

                            return (
                                <div key={schedule.id} className="flex flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="rounded-md border border-[#BFDBFE] bg-[#EAF3FC] px-2.5 py-0.5 text-xs font-semibold text-[#155FA8]">
                                            {t('certificationProgram.detail.schedule.sessionPrefix', 'Sesi {{index}}', { index: index + 1 })}
                                        </span>
                                        <span className="text-xs font-medium tracking-wide text-[#5B6B7F] uppercase">{getDayLabel(schedule)}</span>
                                    </div>

                                    <h3 className="line-clamp-2 text-base font-semibold text-[#162230]">
                                        {schedule.title ||
                                            (dateValue
                                                ? formatIndonesianDate(dateValue, lang)
                                                : t('certificationProgram.detail.schedule.sessionPrefix', 'Sesi {{index}}', { index: index + 1 }))}
                                    </h3>

                                    <div className="mt-auto space-y-1.5 text-xs text-[#475569] sm:text-sm">
                                        {dateValue && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                                <span>{formatIndonesianDate(dateValue, lang)}</span>
                                            </div>
                                        )}
                                        {(startTime || endTime) && (
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                                <span>
                                                    {startTime || '--.--'} {endTime ? `– ${endTime} WIB` : 'WIB'}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                            <span>{t('certificationProgram.detail.register.online', 'Online')}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {program.type === 'scholarship' && socializationSchedules.length > 0 && (
                <div className="border-t border-[#DCE3EC] pt-6">
                    <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                        {t('certificationProgram.detail.schedule.socializationBadge', 'Jadwal Sosialisasi')}
                    </h2>
                    <p className="mt-1 mb-5 text-sm text-[#5B6B7F]">
                        {t('certificationProgram.detail.schedule.socializationSubtitle', 'Tahapan awal sosialisasi beasiswa sebelum proses seleksi utama dimulai')}
                    </p>

                    <div className="grid gap-4 sm:grid-cols-2">
                        {socializationSchedules.map((schedule, index) => {
                            const dateValue = getDate(schedule);
                            const startTime = formatTime(schedule.start_time);
                            const endTime = formatTime(schedule.end_time);

                            return (
                                <div key={schedule.id} className="rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <div className="mb-2 flex items-center justify-between gap-2">
                                        <h3 className="text-base font-semibold text-[#162230]">
                                            {schedule.title ||
                                                t('certificationProgram.detail.schedule.socializationStage', 'Tahap {{index}}', { index: index + 1 })}
                                        </h3>
                                        <span className="shrink-0 rounded-md border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                                            {t('certificationProgram.detail.schedule.socializationTag', 'Sosialisasi')}
                                        </span>
                                    </div>

                                    <div className="space-y-1.5 text-xs text-[#475569] sm:text-sm">
                                        {dateValue && (
                                            <p className="flex items-center gap-2">
                                                <Calendar className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                                <span>
                                                    {getDayLabel(schedule)}, {formatIndonesianDate(dateValue, lang)}
                                                </span>
                                            </p>
                                        )}
                                        {(startTime || endTime) && (
                                            <p className="flex items-center gap-2">
                                                <Clock className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                                <span>
                                                    {startTime || '--.--'} {endTime ? `– ${endTime} WIB` : 'WIB'}
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </section>
    );
}
