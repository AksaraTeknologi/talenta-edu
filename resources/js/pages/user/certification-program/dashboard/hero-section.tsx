import { CatalogHero } from '@/components/catalog-hero';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation(['user', 'common', 'home']);

    const advantageSection = [
        {
            title: t('certificationProgram.dashboard.features.f1Title', 'Sertifikat Resmi dari Ahli Industri.'),
            description: t('certificationProgram.dashboard.features.f1Subtitle', 'Dapatkan sertifikat yang diakui industri dari mentor dan lembaga profesional terpercaya.'),
        },
        {
            title: t('certificationProgram.dashboard.features.f2Title', 'Kurikulum Terupdate.'),
            description: t('certificationProgram.dashboard.features.f2Subtitle', 'Konten pembelajaran selalu diperbarui mengikuti perkembangan teknologi dan tren industri terkini.'),
        },
        {
            title: t('certificationProgram.dashboard.features.f3AdvTitle', 'Bimbingan Praktisi Berpengalaman.'),
            description: t('certificationProgram.dashboard.features.f3AdvSubtitle', 'Materi disampaikan langsung oleh praktisi yang ahli di bidangnya sehingga relevan dengan dunia kerja.'),
        },
        {
            title: t('certificationProgram.dashboard.features.f3Title', 'Fleksibel & Terjangkau.'),
            description: t('certificationProgram.dashboard.features.f3Subtitle', 'Jadwal yang fleksibel dengan harga terjangkau, termasuk opsi beasiswa untuk pengembangan karirmu.'),
        }
    ];

    return (
        <CatalogHero
            pageLabel={t('certificationProgram.dashboard.hero.badge', 'Program Sertifikasi')}
            eyebrow={t('certificationProgram.dashboard.hero.badge', 'Program Sertifikasi')}
            title={t('certificationProgram.dashboard.hero.title', 'Raih Sertifikasi Profesional & Tingkatkan Karirmu')}
            description={t('certificationProgram.dashboard.hero.bannerDesc', 'Program Sertifikasi Talenta Academy dirancang bersama para ahli industri untuk meningkatkan skill dan kompetensi Anda. Dapatkan pengalaman belajar intensif, dukungan materi terstruktur, dan raih sertifikat profesional untuk membuka peluang karir yang lebih luas.')}
            image="/assets/images/hero-bootcamp-2.webp"
            imageAlt={t('certificationProgram.dashboard.hero.title', 'Raih Sertifikasi Profesional & Tingkatkan Karirmu')}
            advantages={advantageSection}
            ctaHref="#certification-programs"
            ctaLabel={t('certificationProgram.dashboard.hero.btnViewPrograms', 'Lihat Program Sertifikasi')}
        />
    );
}
