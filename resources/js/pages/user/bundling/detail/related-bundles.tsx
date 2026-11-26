import { ProgramCard } from '@/components/program-card';
import { useTranslation } from 'react-i18next';

interface Bundle {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string | null;
    price: number;
    strikethrough_price: number;
    registration_deadline?: string | null;
    category?: { id: string; name: string };
}

interface RelatedBundlesProps {
    relatedBundles: Bundle[];
}

export default function RelatedBundles({ relatedBundles }: RelatedBundlesProps) {
    const { t } = useTranslation('user');

    if (!relatedBundles || relatedBundles.length === 0) {
        return null;
    }

    return (
        <section className="mt-14 border-t border-[#DCE3EC] pt-12" id="related">
            <div className="mb-8">
                <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                    {t('bundling.detail.related.title', 'Paket Bundling Lainnya')}
                </h2>
                <p className="mt-1.5 text-sm text-[#475569] sm:text-base">
                    {t('bundling.detail.related.subtitle', 'Paket bundling lain yang mungkin menarik untuk Anda')}
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedBundles.map((bundle) => (
                    <ProgramCard
                        key={bundle.id}
                        product={{
                            id: bundle.id,
                            title: bundle.title,
                            slug: bundle.slug,
                            thumbnail: bundle.thumbnail,
                            price: bundle.price,
                            strikethrough_price: bundle.strikethrough_price,
                            registration_deadline: bundle.registration_deadline || undefined,
                            category: bundle.category,
                            type: 'bundle',
                        }}
                        href={route('bundle.detail', bundle.slug)}
                    />
                ))}
            </div>
        </section>
    );
}
