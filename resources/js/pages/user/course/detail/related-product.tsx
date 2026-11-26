import { ProgramCard } from '@/components/program-card';
import { useTranslation } from 'react-i18next';

interface Course {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    level: 'beginner' | 'intermediate' | 'advanced';
    category?: {
        name: string;
    };
}

interface RelatedProductProps {
    relatedCourses: Course[];
    myCourseIds: string[];
}

export default function RelatedProduct({ relatedCourses, myCourseIds }: RelatedProductProps) {
    const { t } = useTranslation('user');

    if (!relatedCourses || relatedCourses.length === 0) {
        return null;
    }

    return (
        <section className="mt-14 border-t border-[#DCE3EC] pt-12" id="related">
            <div className="mb-8">
                <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                    {t('course.detail.similarCourses', 'Kelas Serupa')}
                </h2>
                <p className="mt-1.5 text-sm text-[#475569] sm:text-base">
                    {t('course.detail.similarSubtitle', 'Kelas lain yang mungkin menarik untuk Anda')}
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedCourses.map((course) => {
                    const hasAccess = myCourseIds.includes(course.id);
                    return (
                        <ProgramCard
                            key={course.id}
                            product={{
                                id: course.id,
                                title: course.title,
                                slug: course.slug,
                                thumbnail: course.thumbnail,
                                price: course.price,
                                strikethrough_price: course.strikethrough_price,
                                level: course.level,
                                category: course.category,
                                type: 'course',
                            }}
                            href={hasAccess ? `/profile/my-courses/${course.slug}` : `/course/${course.slug}`}
                            hasAccess={hasAccess}
                        />
                    );
                })}
            </div>
        </section>
    );
}
