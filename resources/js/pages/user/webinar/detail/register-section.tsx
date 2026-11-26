import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { calculateDiscountPercent, formatIndonesianDate } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Hourglass, MapPin, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Webinar {
    title: string;
    batch?: string | null;
    strikethrough_price: number;
    price: number;
    quota: number;
    description?: string | null;
    start_time: string;
    end_time: string;
    registration_deadline: string;
    registration_url: string;
    thumbnail?: string | null;
    user?: {
        id: string;
        name: string;
        bio?: string;
        avatar?: string;
    };
}

export default function RegisterSection({ webinar }: { webinar: Webinar }) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';

    const registrationUrl = webinar.registration_url;
    const buttonText = t('webinar.detail.btnJoinNow', 'Gabung Sekarang');
    const deadline = new Date(webinar.registration_deadline);
    const isRegistrationOpen = new Date() < deadline;
    const discountPercent = calculateDiscountPercent(webinar.strikethrough_price, webinar.price);

    return (
        <div className="rounded-2xl border border-[#DCE3EC] bg-white p-6 shadow-md">
            {/* Price & Discount */}
            <div className="mb-5">
                {discountPercent > 0 && webinar.strikethrough_price > 0 && (
                    <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="text-sm text-[#64748B] line-through tabular-nums">
                            Rp {webinar.strikethrough_price.toLocaleString('id-ID')}
                        </span>
                        <span className="rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                            {t('home:latest.save', { discount: discountPercent, defaultValue: `Hemat ${discountPercent}%` })}
                        </span>
                    </div>
                )}

                {webinar.price > 0 ? (
                    <h2 className="font-literata text-3xl font-bold text-[#12344E] tabular-nums">
                        Rp {webinar.price.toLocaleString('id-ID')}
                    </h2>
                ) : (
                    <h2 className="font-literata text-3xl font-bold text-[#15803D]">{t('webinar.detail.free', 'GRATIS')}</h2>
                )}
            </div>

            {/* Primary CTA */}
            {isRegistrationOpen ? (
                <Button className="mb-5 h-12 w-full rounded-lg text-base font-semibold" size="lg" asChild>
                    <Link href={registrationUrl}>{buttonText}</Link>
                </Button>
            ) : (
                <Button className="mb-5 h-12 w-full rounded-lg text-base" size="lg" disabled>
                    {t('webinar.detail.registrationClosed', 'Pendaftaran Ditutup')}
                </Button>
            )}

            <Separator className="mb-5 bg-[#DCE3EC]" />

            {/* Meta Info (Quota displayed once here) */}
            <div className="space-y-3 text-sm text-[#475569]">
                <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>{t('webinar.detail.onlinePlatform', 'Google Meet/Zoom')}</span>
                </div>
                {webinar.batch && (
                    <div className="flex items-start gap-3">
                        <Hourglass className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                        <span>{t('webinar.detail.batch', { batch: webinar.batch, defaultValue: `Batch ${webinar.batch}` })}</span>
                    </div>
                )}
                <div className="flex items-start gap-3">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                    <span>
                        {webinar.quota
                            ? t('webinar.detail.quotaParticipants', { quota: webinar.quota, defaultValue: `Kuota ${webinar.quota} Peserta` })
                            : t('webinar.detail.unlimitedQuota', 'Kuota Tidak Terbatas')}
                    </span>
                </div>
            </div>

            <Separator className="my-5 bg-[#DCE3EC]" />

            <div className="rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-3.5">
                <p className="text-xs font-semibold text-[#5B6B7F]">
                    {t('webinar.detail.lastRegistrationLabel', 'Terakhir pendaftaran:')}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#12344E]">
                    {formatIndonesianDate(webinar.registration_deadline, lang)}
                </p>
            </div>
        </div>
    );
}
