import { Reveal } from '@/components/home-motion';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, CalendarX2, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface UnavailableItem {
    title?: string;
    slug?: string;
    status?: string;
}

export default function UnavailablePage({
    title,
    item,
    message,
    adminWhatsappUrl,
    backUrl,
    backLabel,
}: {
    title?: string;
    item?: UnavailableItem;
    message?: string;
    adminWhatsappUrl: string;
    backUrl?: string;
    backLabel?: string;
}) {
    const { t } = useTranslation('user');
    const pageTitle = title || t('unavailable.title');
    const itemTitle = item?.title ? `"${item.title}"` : t('unavailable.thisPage');

    return (
        <UserLayout>
            <Head title={pageTitle} />

            <section className="flex w-full flex-1 items-center bg-[#FAF8F4] py-16 sm:py-24">
                <div className="mx-auto w-full max-w-2xl px-4 sm:px-6">
                    <Reveal immediate y={20} duration={0.6}>
                        <div className="rounded-2xl border border-[#DCE3EC] bg-white p-8 text-center shadow-xs sm:p-12">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl border border-[#FED7AA] bg-[#FFF3EB]">
                                <CalendarX2 className="h-8 w-8 text-[#D95B16]" aria-hidden="true" />
                            </div>

                            <h1 className="font-literata text-2xl leading-tight font-bold text-[#12344E] sm:text-3xl">{pageTitle}</h1>
                            <p className="mt-3 text-base text-[#475569]">
                                {itemTitle} {t('unavailable.currentlyNotAccessible')}
                            </p>

                            <div className="mt-6 rounded-xl border border-[#EEF2F6] bg-[#FAF8F4] px-5 py-4 text-left">
                                <p className="text-sm font-semibold text-[#162230]">{message || t('unavailable.defaultMessage')}</p>
                                <p className="mt-1 text-sm text-[#5B6B7F]">{t('unavailable.errorHint')}</p>
                            </div>

                            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                <Button asChild variant="outline" size="lg" className="h-12 flex-1">
                                    <Link href={backUrl || '/'}>
                                        <ArrowLeft className="h-4 w-4" />
                                        {backLabel || t('unavailable.back')}
                                    </Link>
                                </Button>
                                <Button asChild size="lg" className="h-12 flex-1">
                                    <a href={adminWhatsappUrl} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="h-4 w-4" />
                                        {t('unavailable.contactAdmin')}
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </Reveal>
                </div>
            </section>
        </UserLayout>
    );
}
