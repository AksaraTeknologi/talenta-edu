import { CatalogSection, type CatalogItem } from '@/components/catalog-section';
import { useTranslation } from 'react-i18next';

interface BundleItem {
    id: string;
    bundleable_type: string;
    bundleable: {
        id: string;
        title: string;
        slug: string;
    };
    price: number;
}

interface User {
    name: string;
    bio?: string;
    avatar?: string | null;
}

interface Bundle {
    id: string;
    title: string;
    slug: string;
    short_description: string | null;
    thumbnail: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline: string | null;
    batch?: string | null;
    status: 'draft' | 'published' | 'archived';
    bundle_items: BundleItem[];
    bundle_items_count: number;
    user?: User;
}

interface BundlingSectionProps {
    bundles: Bundle[];
}

export default function BundlingSection({ bundles }: BundlingSectionProps) {
    const { t } = useTranslation('user');

    const items: CatalogItem[] = bundles
        .filter((bundle) => bundle.status === 'published')
        .map((bundle) => {
            const tags = [
                t('bundling.dashboard.catalog.programsCount', {
                    count: bundle.bundle_items_count,
                    defaultValue: `${bundle.bundle_items_count} Program`,
                }),
            ];
            if (bundle.batch) {
                tags.push(
                    bundle.batch.toLowerCase().includes('batch')
                        ? bundle.batch
                        : t('bundling.dashboard.catalog.batch', { batch: bundle.batch, defaultValue: `Batch ${bundle.batch}` }),
                );
            }

            return {
                id: bundle.id,
                href: route('bundle.detail', bundle.slug),
                mentorName: bundle.user?.name,
                tags,
                product: {
                    ...bundle,
                    registration_deadline: bundle.registration_deadline ?? undefined,
                    type: 'bundle',
                },
            };
        });

    return (
        <CatalogSection
            id="bundles"
            title={t('bundling.dashboard.catalog.title', 'Pilih Paket Bundling Terbaik Untukmu')}
            subtitle={t('bundling.dashboard.catalog.subtitle', 'Hemat lebih banyak dengan membeli paket bundling program pembelajaran.')}
            items={items}
            searchPlaceholder={t('bundling.dashboard.catalog.searchPlaceholder', 'Cari paket bundling...')}
            emptyText={t('bundling.dashboard.catalog.emptyDefault', 'Belum ada paket bundling yang tersedia saat ini.')}
            emptySearchText={t('bundling.dashboard.catalog.emptySearch', 'Tidak ada paket bundling yang sesuai dengan pencarian.')}
            allLabel={t('bundling.dashboard.catalog.all', 'Semua')}
            loadMoreLabel={t('bundling.dashboard.catalog.loadMore', 'Lihat Lebih Banyak')}
        />
    );
}
