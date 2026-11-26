import { PosterPreviewDialog } from '@/components/poster-preview-dialog';
import { ProgramBadge } from '@/components/program-badge';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { formatIndonesianDate, resolveStorageUrl, rupiahFormatter } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Clock, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BenefitsSection from './benefits-section';
import BundleItemsSection from './bundle-items-section';
import RegisterSection from './register-section';
import RelatedBundles from './related-bundles';

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
    order: number;
}

interface GroupedItems {
    courses: BundleItem[];
    bootcamps: BundleItem[];
    webinars: BundleItem[];
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description?: string | null;
    description?: string | null;
    benefits?: string | null;
    thumbnail?: string | null;
    batch?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline?: string | null;
    registration_url: string;
    status: string;
    bundle_items: BundleItem[];
    bundle_items_count: number;
}

interface BundleDetailProps {
    bundle: Bundle;
    groupedItems: GroupedItems;
    totalOriginalPrice: number;
    discountAmount: number;
    discountPercentage: number;
    relatedBundles: Bundle[];
    hasOwnedItems: boolean;
    ownedItems: Array<{
        id: string;
        title: string;
        type: string;
    }>;
}

export default function BundleDetail({
    bundle,
    groupedItems,
    totalOriginalPrice,
    discountAmount,
    discountPercentage,
    relatedBundles,
    hasOwnedItems,
    ownedItems,
}: BundleDetailProps) {
    const { t, i18n } = useTranslation('user');
    const lang = i18n.language || 'id';

    return (
        <UserLayout>
            <Head title={t('bundling.detail.headTitle', { title: bundle.title, defaultValue: `${bundle.title} - Paket Bundling` })} />

            <div className="w-full bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-28 sm:px-6 lg:px-8 lg:pb-16">
                    {/* Breadcrumb */}
                    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link href="/bundle" className="hover:text-[#1976D3]">
                            {t('bundling.detail.hero.badge', 'Paket Bundling')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1 text-[#162230]">{bundle.title}</span>
                    </nav>

                    {/* Unified 2-Column Sticky Layout */}
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
                        {/* Left Column */}
                        <div className="min-w-0 space-y-6">
                            <div className="space-y-4">
                                <div className="flex flex-wrap items-center gap-2">
                                    <ProgramBadge type="bundle" labelOverride={t('bundling.detail.hero.badge', 'Paket Bundling')} />
                                    {discountPercentage > 0 && (
                                        <span className="rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-2.5 py-0.5 text-xs font-semibold text-[#B8470A]">
                                            {t('bundling.detail.hero.savePercent', {
                                                percent: discountPercentage,
                                                defaultValue: `Hemat ${discountPercentage}%`,
                                            })}
                                        </span>
                                    )}
                                </div>

                                <h1 className="font-literata text-2xl leading-tight font-bold text-[#12344E] sm:text-3xl">
                                    {bundle.title}
                                </h1>

                                {bundle.short_description && (
                                    <p className="text-sm leading-relaxed text-[#475569] sm:text-base">{bundle.short_description}</p>
                                )}

                                <div className="flex flex-wrap gap-x-6 gap-y-2.5 pt-1 text-sm font-medium text-[#162230]">
                                    <div className="flex items-center gap-2">
                                        <Package className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                        <span>
                                            {t('bundling.detail.hero.programsCount', {
                                                count: bundle.bundle_items_count,
                                                defaultValue: `${bundle.bundle_items_count} Program`,
                                            })}
                                        </span>
                                    </div>
                                    {bundle.registration_deadline && (
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 shrink-0 text-[#1976D3]" />
                                            <span>
                                                {t('bundling.detail.register.deadlineLabel', 'Batas Daftar')}:{' '}
                                                {formatIndonesianDate(bundle.registration_deadline, lang)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <PosterPreviewDialog src={resolveStorageUrl(bundle.thumbnail)} title={bundle.title} />

                            <BundleItemsSection bundle={bundle} groupedItems={groupedItems} totalOriginalPrice={totalOriginalPrice} />

                            <BenefitsSection bundle={bundle} />
                        </div>

                        {/* Right Column: Sticky Price Card */}
                        <div className="lg:sticky lg:top-24" id="register">
                            <RegisterSection
                                bundle={bundle}
                                totalOriginalPrice={totalOriginalPrice}
                                discountAmount={discountAmount}
                                discountPercentage={discountPercentage}
                                hasOwnedItems={hasOwnedItems}
                                ownedItems={ownedItems}
                            />
                        </div>
                    </div>

                    <RelatedBundles relatedBundles={relatedBundles} />
                </div>
            </div>

            {/* Mobile Sticky Bottom CTA Bar */}
            <div className="fixed right-0 bottom-[68px] left-0 z-40 border-t border-[#DCE3EC] bg-white/95 px-4 py-3 shadow-md backdrop-blur-sm lg:hidden">
                <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[11px] font-medium text-[#5B6B7F]">{t('bundling.detail.items.bundlePrice', 'Harga Paket')}</p>
                        <p className="truncate font-literata text-lg font-bold text-[#12344E] tabular-nums">
                            {bundle.price > 0 ? rupiahFormatter.format(bundle.price) : t('bundling.detail.register.free', 'GRATIS')}
                        </p>
                    </div>
                    <Button className="h-11 shrink-0 px-5 font-semibold" asChild>
                        <Link href={bundle.registration_url}>{t('bundling.detail.register.btnRegisterNow', 'Daftar Sekarang')}</Link>
                    </Button>
                </div>
            </div>
        </UserLayout>
    );
}
