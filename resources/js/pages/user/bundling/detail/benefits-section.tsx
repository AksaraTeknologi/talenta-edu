import { parseList } from '@/lib/utils';
import { BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Bundle {
    description?: string | null;
    benefits?: string | null;
}

export default function BenefitsSection({ bundle }: { bundle: Bundle }) {
    const { t } = useTranslation('user');

    if (!bundle.description && !bundle.benefits) {
        return null;
    }

    const benefitsList = parseList(bundle.benefits);

    return (
        <section className="space-y-6 rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6">
            {bundle.description && (
                <div>
                    <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                        {t('bundling.detail.about.aboutTitle', 'Tentang Paket Bundling')}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-[#475569] sm:text-base">{bundle.description}</p>
                </div>
            )}

            {bundle.benefits && (
                <div>
                    <h3 className="font-literata text-lg font-bold text-[#12344E] sm:text-xl">
                        {t('bundling.detail.about.benefitsTitle', 'Keuntungan yang Didapat')}
                    </h3>
                    {benefitsList.length > 0 ? (
                        <ul className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                            {benefitsList.map((benefit, index) => (
                                <li key={index} className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                    <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" />
                                    <p className="text-sm leading-relaxed text-[#162230]">{benefit}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <div className="prose prose-sm mt-3 max-w-none text-[#475569]" dangerouslySetInnerHTML={{ __html: bundle.benefits }} />
                    )}
                </div>
            )}
        </section>
    );
}
