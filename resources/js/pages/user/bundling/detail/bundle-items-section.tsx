import { ProgramBadge } from '@/components/program-badge';
import { resolveStorageUrl, rupiahFormatter } from '@/lib/utils';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Product {
    id: string;
    title: string;
    slug: string;
    price: number;
    thumbnail?: string | null;
}

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable_id: string;
    bundleable: Product;
    price: number;
}

interface GroupedItems {
    courses: BundleItem[];
    bootcamps: BundleItem[];
    webinars: BundleItem[];
}

interface Bundle {
    bundle_items_count: number;
    price: number;
}

interface BundleItemsSectionProps {
    bundle: Bundle;
    groupedItems: GroupedItems;
    totalOriginalPrice: number;
}

export default function BundleItemsSection({ bundle, groupedItems, totalOriginalPrice }: BundleItemsSectionProps) {
    const { t } = useTranslation('user');

    const getProductUrl = (type: string, slug: string) => {
        switch (type) {
            case 'course':
                return route('course.detail', slug);
            case 'bootcamp':
                return route('bootcamp.detail', slug);
            case 'webinar':
                return route('webinar.detail', slug);
            default:
                return '#';
        }
    };

    const renderGroup = (items: BundleItem[], type: 'course' | 'bootcamp' | 'webinar') => {
        if (items.length === 0) return null;

        return (
            <div className="space-y-3">
                {items.map((item) => {
                    const productUrl = getProductUrl(type, item.bundleable.slug);
                    return (
                        <div
                            key={item.id}
                            className="flex flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                            <div className="flex min-w-0 items-center gap-3.5">
                                <img
                                    src={resolveStorageUrl(item.bundleable.thumbnail) || '/assets/images/placeholder.png'}
                                    alt={item.bundleable.title}
                                    className="h-14 w-20 shrink-0 rounded-lg border border-[#DCE3EC] bg-white object-contain p-1"
                                />
                                <div className="min-w-0">
                                    <ProgramBadge type={type} className="mb-1.5" />
                                    <h3 className="line-clamp-2 text-sm font-semibold text-[#162230] sm:text-base">
                                        {item.bundleable.title}
                                    </h3>
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center justify-between gap-4 border-t border-[#DCE3EC] pt-2.5 sm:border-t-0 sm:pt-0">
                                <div className="text-left sm:text-right">
                                    <p className="text-[11px] font-medium text-[#5B6B7F]">
                                        {t('bundling.detail.items.normalPrice', 'Harga Normal')}
                                    </p>
                                    <p className="text-sm font-semibold text-[#12344E] tabular-nums">
                                        {item.price === 0 ? t('bundling.dashboard.catalog.free', 'Gratis') : rupiahFormatter.format(item.price)}
                                    </p>
                                </div>
                                <a
                                    href={productUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#B8C5D6] bg-white text-[#12344E] transition-colors hover:border-[#1976D3] hover:text-[#1976D3]"
                                    aria-label={item.bundleable.title}
                                >
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    const savings = Math.max(0, totalOriginalPrice - bundle.price);

    return (
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6">
            <div className="mb-5">
                <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                    {t('bundling.detail.items.title', {
                        count: bundle.bundle_items_count,
                        defaultValue: `${bundle.bundle_items_count} Program dalam Paket Ini`,
                    })}
                </h2>
                <p className="mt-1 text-sm text-[#475569]">
                    {t('bundling.detail.items.subtitle', 'Dapatkan akses lengkap ke seluruh program di bawah ini dalam satu paket hemat.')}
                </p>
            </div>

            <div className="space-y-3">
                {renderGroup(groupedItems.courses, 'course')}
                {renderGroup(groupedItems.bootcamps, 'bootcamp')}
                {renderGroup(groupedItems.webinars, 'webinar')}
            </div>

            {totalOriginalPrice > 0 && savings > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-3 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4 sm:grid-cols-3">
                    <div>
                        <p className="text-xs font-medium text-[#5B6B7F]">{t('bundling.detail.items.normalPrice', 'Total Harga Normal')}</p>
                        <p className="mt-0.5 text-base font-semibold text-[#64748B] line-through tabular-nums">
                            {rupiahFormatter.format(totalOriginalPrice)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#5B6B7F]">{t('bundling.detail.items.youSave', 'Anda Hemat')}</p>
                        <p className="mt-0.5 text-base font-bold text-[#15803D] tabular-nums">{rupiahFormatter.format(savings)}</p>
                    </div>
                    <div>
                        <p className="text-xs font-medium text-[#5B6B7F]">{t('bundling.detail.items.bundlePrice', 'Harga Paket')}</p>
                        <p className="mt-0.5 text-base font-bold text-[#12344E] tabular-nums">{rupiahFormatter.format(bundle.price)}</p>
                    </div>
                </div>
            )}
        </section>
    );
}
