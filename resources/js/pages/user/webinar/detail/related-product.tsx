import { ProgramCard } from '@/components/program-card';
import { useTranslation } from 'react-i18next';

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    start_time: string;
    category?: {
        name: string;
    };
}

interface RelatedProductProps {
    relatedWebinars: Webinar[];
    myWebinarIds: string[];
}

export default function RelatedProduct({ relatedWebinars, myWebinarIds }: RelatedProductProps) {
    const { t } = useTranslation('user');

    if (!relatedWebinars || relatedWebinars.length === 0) {
        return null;
    }

    return (
        <section className="mt-14 border-t border-[#DCE3EC] pt-12" id="related">
            <div className="mb-8">
                <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                    {t('webinar.detail.similarTitle', 'Webinar Serupa')}
                </h2>
                <p className="mt-1.5 text-sm text-[#475569] sm:text-base">
                    {t('webinar.detail.similarSubtitle', 'Webinar lain yang mungkin menarik untuk Anda')}
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedWebinars.map((webinar) => {
                    const hasAccess = myWebinarIds.includes(webinar.id);
                    return (
                        <ProgramCard
                            key={webinar.id}
                            product={{
                                id: webinar.id,
                                title: webinar.title,
                                slug: webinar.slug,
                                thumbnail: webinar.thumbnail,
                                price: webinar.price,
                                strikethrough_price: webinar.strikethrough_price,
                                start_time: webinar.start_time,
                                category: webinar.category,
                                type: 'webinar',
                            }}
                            href={hasAccess ? `/profile/my-webinars/${webinar.slug}` : `/webinar/${webinar.slug}`}
                            hasAccess={hasAccess}
                        />
                    );
                })}
            </div>
        </section>
    );
}
