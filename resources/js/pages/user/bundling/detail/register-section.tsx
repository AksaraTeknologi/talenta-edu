import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { formatIndonesianDate, rupiahFormatter } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { AlertTriangle, BadgeCheck, Clock, Layers, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Bundle {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
    registration_deadline?: string | null;
    registration_url: string;
    batch?: string | null;
    bundle_items_count: number;
}

interface OwnedItem {
    id: string;
    title: string;
    type: string;
}

interface RegisterSectionProps {
    bundle: Bundle;
    totalOriginalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    hasOwnedItems: boolean;
    ownedItems: OwnedItem[];
}

export default function RegisterSection({
    bundle,
    totalOriginalPrice,
    discountAmount,
    discountPercentage,
    hasOwnedItems,
    ownedItems,
}: RegisterSectionProps) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';

    return (
        <div className="space-y-4">
            {hasOwnedItems && (
                <Alert variant="destructive" className="border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs leading-relaxed sm:text-sm">
                        <p className="mb-1.5 font-semibold">
                            {t('bundling.detail.register.ownedWarningTitle', 'Anda sudah memiliki produk berikut dalam bundle ini:')}
                        </p>
                        <ul className="ml-4 list-disc space-y-0.5">
                            {ownedItems.map((item) => (
                                <li key={item.id}>
                                    <span className="font-medium">{item.type}:</span> {item.title}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-1.5">
                            {t('bundling.detail.register.ownedWarningDesc', 'Untuk menghindari duplikasi, Anda tidak dapat membeli bundle ini.')}
                        </p>
                    </AlertDescription>
                </Alert>
            )}

            <div className="rounded-2xl border border-[#DCE3EC] bg-white p-6 shadow-md">
                <div className="mb-5">
                    {discountPercentage > 0 && totalOriginalPrice > bundle.price && (
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-sm text-[#64748B] line-through tabular-nums">
                                {rupiahFormatter.format(totalOriginalPrice)}
                            </span>
                            <span className="rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                                {t('home:latest.save', { discount: discountPercentage, defaultValue: `Hemat ${discountPercentage}%` })}
                            </span>
                        </div>
                    )}

                    {bundle.price > 0 ? (
                        <h2 className="font-literata text-3xl font-bold text-[#12344E] tabular-nums">
                            {rupiahFormatter.format(bundle.price)}
                        </h2>
                    ) : (
                        <h2 className="font-literata text-3xl font-bold text-[#15803D]">
                            {t('bundling.detail.register.free', 'GRATIS')}
                        </h2>
                    )}
                </div>

                <Button className="mb-5 h-12 w-full rounded-lg text-base font-semibold" size="lg" asChild>
                    <Link href={bundle.registration_url}>{t('bundling.detail.register.btnRegisterNow', 'Daftar Sekarang')}</Link>
                </Button>

                <Separator className="mb-5 bg-[#DCE3EC]" />

                <div className="space-y-3 text-sm text-[#475569]">
                    <div className="flex items-start gap-3">
                        <Package className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                        <span>
                            {t('bundling.detail.register.programsCount', {
                                count: bundle.bundle_items_count,
                                defaultValue: `${bundle.bundle_items_count} Program Pembelajaran`,
                            })}
                        </span>
                    </div>
                    {bundle.batch && (
                        <div className="flex items-start gap-3">
                            <Layers className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                            <span>
                                {bundle.batch.toLowerCase().includes('batch')
                                    ? bundle.batch
                                    : t('bundling.detail.register.batch', { batch: bundle.batch, defaultValue: `Batch ${bundle.batch}` })}
                            </span>
                        </div>
                    )}
                    {discountAmount > 0 && (
                        <div className="flex items-start gap-3">
                            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                            <span className="font-medium text-[#15803D]">
                                {t('bundling.detail.register.saveLabel', 'Hemat')} {rupiahFormatter.format(discountAmount)}
                            </span>
                        </div>
                    )}
                </div>

                {bundle.registration_deadline && (
                    <>
                        <Separator className="my-5 bg-[#DCE3EC]" />
                        <div className="rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-3.5">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#5B6B7F]">
                                <Clock className="h-3.5 w-3.5" />
                                <span>{t('bundling.detail.register.deadlineLabel', 'Batas Pendaftaran')}</span>
                            </div>
                            <p className="mt-1 text-sm font-semibold text-[#12344E]">
                                {formatIndonesianDate(bundle.registration_deadline, lang)}
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
