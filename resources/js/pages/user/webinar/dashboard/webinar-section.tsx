import { CatalogSection, type CatalogItem } from '@/components/catalog-section';
import { useTranslation } from 'react-i18next';

type Category = {
    id: string;
    name: string;
};

interface Webinar {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    start_time: string;
    category: Category;
}

interface WebinarProps {
    categories: Category[];
    webinars: Webinar[];
    myWebinarIds: string[];
}

export default function WebinarSection({ categories, webinars, myWebinarIds }: WebinarProps) {
    const { t } = useTranslation('user');

    const items: CatalogItem[] = webinars.map((webinar) => {
        const hasAccess = myWebinarIds.includes(webinar.id);
        return {
            id: webinar.id,
            href: hasAccess ? `/profile/my-webinars/${webinar.slug}` : `/webinar/${webinar.slug}`,
            hasAccess,
            product: { ...webinar, type: 'webinar' },
        };
    });

    return (
        <CatalogSection
            id="webinar"
            title={t('webinar.hero.bannerTitle', 'Webinar Program')}
            items={items}
            categories={categories}
            searchPlaceholder={t('webinar.catalog.searchPlaceholder', 'Cari Program Webinar...')}
            emptyText={t('webinar.catalog.empty', 'Belum ada webinar yang tersedia saat ini.')}
            allLabel={t('webinar.catalog.allCategory', 'Semua')}
            loadMoreLabel={t('webinar.catalog.loadMore', 'Lihat Lebih Banyak')}
        />
    );
}
