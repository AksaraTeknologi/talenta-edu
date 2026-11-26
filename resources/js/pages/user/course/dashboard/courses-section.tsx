import { CatalogSection, type CatalogItem } from '@/components/catalog-section';
import { useTranslation } from 'react-i18next';

type Category = {
    id: string;
    name: string;
};

interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category: Category;
    user: {
        name: string;
    };
}

interface CourseProps {
    categories: Category[];
    courses: Course[];
    myCourseIds: string[];
}

export default function CoursesSection({ categories, courses, myCourseIds }: CourseProps) {
    const { t } = useTranslation('user');

    const items: CatalogItem[] = courses.map((course) => {
        const hasAccess = myCourseIds.includes(course.id);
        return {
            id: course.id,
            href: hasAccess ? `/profile/my-courses/${course.slug}` : `/course/${course.slug}`,
            hasAccess,
            mentorName: course.user?.name,
            product: { ...course, type: 'course' },
        };
    });

    return (
        <CatalogSection
            id="courses-section"
            title={t('course.catalog.title', 'Online Class Program')}
            items={items}
            categories={categories}
            searchPlaceholder={t('course.catalog.searchPlaceholder', 'Cari Program Kelas Online...')}
            emptyText={t('course.catalog.emptyDesc', 'Belum ada kelas yang tersedia saat ini.')}
            allLabel={t('course.catalog.allCategory', 'Semua')}
            loadMoreLabel={t('course.catalog.loadMore', 'Lihat Lebih Banyak')}
        />
    );
}
