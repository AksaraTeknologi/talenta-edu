import { CatalogHero } from '@/components/catalog-hero';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation(['user', 'common']);

    const benefits = [
        { title: t('bundling.dashboard.hero.benefit1', 'Hemat hingga 70% dari harga normal') },
        { title: t('bundling.dashboard.hero.benefit2', 'Akses ke beberapa program sekaligus') },
        { title: t('bundling.dashboard.hero.benefit3', 'Sertifikat untuk semua program') },
        { title: t('bundling.dashboard.hero.benefit4', 'Pembelajaran fleksibel') },
    ];

    const title = `${t('bundling.dashboard.hero.titlePart1', 'Belajar Lebih Banyak')}, ${t('bundling.dashboard.hero.titlePart2', 'Bayar Lebih Hemat!')}`;

    return (
        <CatalogHero
            pageLabel={t('common:nav.bundling', 'Bundling')}
            eyebrow={t('bundling.dashboard.hero.badge', 'Penawaran Spesial Paket Bundling')}
            title={title}
            description={t(
                'bundling.dashboard.hero.desc',
                'Dapatkan akses ke beberapa program pembelajaran sekaligus dengan harga spesial. Tingkatkan skill-mu dengan paket bundling yang dirancang khusus untuk percepatan karirmu!',
            )}
            image="/assets/images/hero-bundle.webp"
            imageAlt={title}
            advantages={benefits}
            ctaHref="#bundles"
            ctaLabel={t('bundling.dashboard.hero.btnViewBundles', 'Lihat Paket Bundling')}
            whatsappUrl="https://wa.me/+6281252683108"
        />
    );
}
