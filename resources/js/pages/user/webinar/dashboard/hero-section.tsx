import { CatalogHero } from '@/components/catalog-hero';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation(['user', 'common', 'home']);

    const advantageSection = [
        {
            title: t('webinar.hero.adv1Title', 'Waktu Fleksibel & Terjadwal'),
            description: t('webinar.hero.adv1Desc', 'Diselenggarakan sesuai jadwal yang telah ditentukan, memudahkan peserta menyesuaikan dengan aktivitas harian.'),
        },
        {
            title: t('webinar.hero.adv2Title', 'Pemateri Berpengalaman'),
            description: t('webinar.hero.adv2Desc', 'Dipandu oleh praktisi dan instruktur berpengalaman yang memahami praktik di lapangan.'),
        },
        {
            title: t('webinar.hero.adv3Title', 'Materi Fokus & Relevan'),
            description: t('webinar.hero.adv3Desc', 'Pembahasan topik spesifik yang langsung aplikatif dan sesuai kebutuhan akuntansi, pajak, dan audit terkini.')
        },
        {
            title: t('webinar.hero.adv4Title', 'Akses Online & Materi Pendukung'),
            description: t('webinar.hero.adv4Desc', 'Dapat diikuti dari mana saja dengan dukungan materi pembelajaran untuk memudahkan pemahaman peserta.')
        }
    ];

    return (
        <CatalogHero
            pageLabel={t('common:nav.webinar', 'Webinar')}
            eyebrow={t('webinar.hero.advTitle', 'Webinar Profesional Talenta Academy')}
            title={t('webinar.hero.title', 'Belajar Langsung dari Praktisi. Terjangkau & Relevan dengan Industri.')}
            description={t('webinar.hero.bannerDesc', 'Webinar Program Talenta Academy merupakan pelatihan berbasis online yang diselenggarakan sesuai jadwal dan waktu yang telah ditentukan. Program ini dirancang untuk membahas topik tertentu secara fokus dan praktis, dipandu oleh pemateri berpengalaman, serta dilengkapi dengan materi pendukung.')}
            image="/assets/images/hero-webinar.webp"
            imageAlt={t('webinar.hero.bannerTitle', 'Webinar Program')}
            advantages={advantageSection}
            ctaHref="#webinar"
            ctaLabel={t('webinar.hero.btnViewWebinar', 'Lihat Webinar')}
        />
    );
}
