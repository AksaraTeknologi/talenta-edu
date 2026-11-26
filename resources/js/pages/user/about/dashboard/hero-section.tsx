import { CatalogHero } from '@/components/catalog-hero';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation(['user', 'common', 'home']);

    const features = [1, 2, 3, 4].map((n) => ({
        title: t(`about.dashboard.f${n}Title`),
        description: t(`about.dashboard.f${n}Desc`),
    }));

    return (
        <CatalogHero
            pageLabel={t('common:nav.about', 'Tentang Kami')}
            eyebrow={t('about.dashboard.aboutUs')}
            title={t('about.dashboard.companyName').replace(/\.\s*$/, '')}
            description={t('about.dashboard.description')}
            image="/assets/images/about.png"
            imageAlt={t('about.dashboard.companyName')}
            imageVariant="framed"
            advantages={features}
            ctaHref="/#pelatihan-terbaru"
            ctaLabel={t('home:hero.ctaPrimary', 'Lihat Jadwal Pelatihan')}
        />
    );
}
