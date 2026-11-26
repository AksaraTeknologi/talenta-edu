import { ProgramCard } from '@/components/program-card';
import { useTranslation } from 'react-i18next';

interface Bootcamp {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    start_date: string;
    end_date: string;
    category?: {
        name: string;
    };
}

interface RelatedProductProps {
    relatedBootcamps: Bootcamp[];
    myBootcampIds: string[];
}

export default function RelatedProduct({ relatedBootcamps, myBootcampIds }: RelatedProductProps) {
    const { t } = useTranslation('user');

    if (!relatedBootcamps || relatedBootcamps.length === 0) {
        return null;
    }

    return (
        <section className="mt-14 border-t border-[#DCE3EC] pt-12" id="related">
            <div className="mb-8">
                <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                    {t('bootcamp.detail.similarTitle', 'Bootcamp Serupa')}
                </h2>
                <p className="mt-1.5 text-sm text-[#475569] sm:text-base">
                    {t('bootcamp.detail.similarSubtitle', 'Bootcamp lain yang mungkin menarik untuk Anda')}
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBootcamps.map((bootcamp) => {
                    const hasAccess = myBootcampIds.includes(bootcamp.id);
                    return (
                        <ProgramCard
                            key={bootcamp.id}
                            product={{
                                id: bootcamp.id,
                                title: bootcamp.title,
                                slug: bootcamp.slug,
                                thumbnail: bootcamp.thumbnail,
                                price: bootcamp.price,
                                strikethrough_price: bootcamp.strikethrough_price,
                                start_date: bootcamp.start_date,
                                end_date: bootcamp.end_date,
                                category: bootcamp.category,
                                type: 'bootcamp',
                            }}
                            href={hasAccess ? `/profile/my-bootcamps/${bootcamp.slug}` : `/bootcamp/${bootcamp.slug}`}
                            hasAccess={hasAccess}
                        />
                    );
                })}
            </div>
        </section>
    );
}
