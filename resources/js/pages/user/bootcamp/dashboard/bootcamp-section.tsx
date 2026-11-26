import { CatalogSection, type CatalogItem } from '@/components/catalog-section';
import { useTranslation } from 'react-i18next';

type Category = {
    id: string;
    name: string;
};

interface Bootcamp {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    start_date: string;
    end_date: string;
    category: Category;
    mentors?: Array<{
        name: string;
    }>;
    user?: {
        name: string;
    };
}

interface BootcampProps {
    categories: Category[];
    bootcamps: Bootcamp[];
    myBootcampIds: string[];
}

export default function BootcampSection({ categories, bootcamps, myBootcampIds }: BootcampProps) {
    const { t } = useTranslation('user');

    const items: CatalogItem[] = bootcamps.map((bootcamp) => {
        const hasAccess = myBootcampIds.includes(bootcamp.id);
        const mentorNames = bootcamp.mentors?.length ? bootcamp.mentors.map((mentor) => mentor.name).join(', ') : bootcamp.user?.name;
        return {
            id: bootcamp.id,
            href: hasAccess ? `/profile/my-bootcamps/${bootcamp.slug}` : `/bootcamp/${bootcamp.slug}`,
            hasAccess,
            mentorName: mentorNames,
            product: { ...bootcamp, type: 'bootcamp' },
        };
    });

    return (
        <CatalogSection
            id="bootcamp"
            title={t('bootcamp.catalog.scheduleTitle', 'Jadwal Bootcamp')}
            items={items}
            categories={categories}
            searchPlaceholder={t('bootcamp.catalog.searchPlaceholder', 'Cari Program bootcamp...')}
            emptyText={t('bootcamp.catalog.emptyDesc', 'Belum ada bootcamp yang tersedia saat ini.')}
            allLabel={t('bootcamp.catalog.allCategory', 'Semua')}
            loadMoreLabel={t('bootcamp.catalog.loadMore', 'Lihat Lebih Banyak')}
        />
    );
}
