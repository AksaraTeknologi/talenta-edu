import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { calculateDiscountPercent, formatIndonesianDate } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Clock, Hourglass, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Bootcamp {
    title: string;
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    description?: string | null;
    start_date: string;
    end_date: string;
    schedules?: { schedule_date: string; day: string; start_time: string; end_time: string }[];
    registration_deadline: string;
    registration_url: string;
    thumbnail?: string | null;
}

export default function RegisterSection({ bootcamp }: { bootcamp: Bootcamp }) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';
    const locale = lang.startsWith('en') ? 'en-US' : 'id-ID';

    const registrationUrl = bootcamp.registration_url;
    const buttonText = t('bootcamp.detail.btnRegisterNow', 'Daftar Sekarang');
    const deadline = new Date(bootcamp.registration_deadline);
    const isRegistrationOpen = new Date() < deadline;
    const discountPercent = calculateDiscountPercent(bootcamp.strikethrough_price, bootcamp.price);

    return (
        <div className="rounded-2xl border border-[#DCE3EC] bg-white p-6 shadow-md">
            {/* Price & Discount */}
            <div className="mb-5">
                {discountPercent > 0 && bootcamp.strikethrough_price > 0 && (
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-[#64748B] line-through tabular-nums">
                            Rp {bootcamp.strikethrough_price.toLocaleString('id-ID')}
                        </span>
                        <span className="rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                            {t('home:latest.save', { discount: discountPercent, defaultValue: `Hemat ${discountPercent}%` })}
                        </span>
                    </div>
                )}

                {bootcamp.price > 0 ? (
                    <h2 className="font-literata text-3xl font-bold text-[#12344E] tabular-nums">
                        Rp {bootcamp.price.toLocaleString('id-ID')}
                    </h2>
                ) : (
                    <h2 className="font-literata text-3xl font-bold text-[#15803D]">{t('bootcamp.detail.free', 'GRATIS')}</h2>
                )}
            </div>

            {isRegistrationOpen ? (
                <Button className="mb-5 h-12 w-full rounded-lg text-base font-semibold" size="lg" asChild>
                    <Link href={registrationUrl}>{buttonText}</Link>
                </Button>
            ) : (
                <Button className="mb-5 h-12 w-full rounded-lg text-base" size="lg" disabled>
                    {t('bootcamp.detail.registrationClosed', 'Pendaftaran Ditutup')}
                </Button>
            )}

            <Separator className="mb-5 bg-[#DCE3EC]" />

            <div className="space-y-3 text-sm text-[#475569]">
                <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>{t('bootcamp.detail.online', 'Online')}</span>
                </div>
                {bootcamp.batch && (
                    <div className="flex items-start gap-3">
                        <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                        <span>{t('bootcamp.detail.batch', { batch: bootcamp.batch, defaultValue: `Batch ${bootcamp.batch}` })}</span>
                    </div>
                )}
                <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>
                        {bootcamp.quota
                            ? t('bootcamp.detail.quotaParticipants', { quota: bootcamp.quota, defaultValue: `Kuota ${bootcamp.quota} Peserta` })
                            : t('bootcamp.detail.unlimitedQuota', 'Kuota Tidak Terbatas')}
                    </span>
                </div>
            </div>

            {bootcamp.schedules && bootcamp.schedules.length > 0 && (
                <>
                    <Separator className="my-5 bg-[#DCE3EC]" />
                    <div>
                        <p className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-[#5B6B7F]">
                            {t('bootcamp.detail.bootcampSchedule', 'Jadwal Pertemuan')}
                        </p>
                        <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                            {bootcamp.schedules.map((schedule, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-start gap-2 rounded-lg border border-[#DCE3EC] bg-[#FAF8F4] px-3 py-2 text-xs text-[#475569]"
                                >
                                    <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1976D3]" />
                                    <p className="capitalize">
                                        {schedule.day},{' '}
                                        {new Date(schedule.schedule_date).toLocaleDateString(locale, {
                                            day: 'numeric',
                                            month: 'short',
                                        })}{' '}
                                        | {schedule.start_time.slice(0, 5).replace(':', '.')} – {schedule.end_time.slice(0, 5).replace(':', '.')} WIB
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <Separator className="my-5 bg-[#DCE3EC]" />

            <div className="rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-3.5">
                <p className="text-xs font-semibold text-[#5B6B7F]">{t('bootcamp.detail.deadline', 'Terakhir pendaftaran:')}</p>
                <p className="mt-1 text-sm font-semibold text-[#12344E]">{formatIndonesianDate(bootcamp.registration_deadline, lang)}</p>
            </div>
        </div>
    );
}
