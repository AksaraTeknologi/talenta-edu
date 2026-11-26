import { CatalogHero } from '@/components/catalog-hero';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation(['user', 'common', 'home']);

    const advantageSection = [
        {
            title: t('bootcamp.hero.adv1Title', 'Dibimbing Praktisi Senior.'),
            description: t('bootcamp.hero.adv1Desc', 'Materi disampaikan langsung oleh praktisi berpengalaman sehingga peserta memahami praktik nyata sesuai kebutuhan industri.'),
        },
        {
            title: t('bootcamp.hero.adv2Title', 'Didukung Modul & Kelas Online.'),
            description: t('bootcamp.hero.adv2Desc', 'Peserta mendapatkan modul pembelajaran lengkap serta akses kelas online interaktif untuk menunjang proses belajar.'),
        },
        {
            title: t('bootcamp.hero.adv3Title', 'Durasi Panjang & Terstruktur.'),
            description: t('bootcamp.hero.adv3Desc', 'Program dirancang dengan durasi pembelajaran yang lebih mendalam agar peserta benar-benar menguasai materi secara bertahap.'),
        },
        {
            title: t('bootcamp.hero.adv4Title', 'Fokus Praktik & Studi Kasus.'),
            description: t('bootcamp.hero.adv4Desc', 'Pembelajaran berbasis praktik dan studi kasus nyata sehingga skill yang diperoleh siap diterapkan di dunia kerja.'),
        },
    ];

    return (
        <CatalogHero
            pageLabel={t('common:nav.bootcamp', 'Bootcamp')}
            eyebrow={t('bootcamp.hero.advantagesTitle', 'Bootcamp Profesional Talenta Academy')}
            title={t('bootcamp.hero.title', 'Bootcamp Program')}
            description={t('bootcamp.hero.description', 'Bootcamp Talenta Academy merupakan program pelatihan intensif berdurasi panjang yang dibimbing langsung oleh praktisi senior. Didukung modul pembelajaran terstruktur dan kelas online interaktif, program ini dirancang untuk membekali peserta dengan keterampilan praktis yang siap diterapkan di dunia kerja.')}
            image="/assets/images/hero-bootcamp-2.webp"
            imageAlt={t('bootcamp.hero.title', 'Bootcamp Program')}
            advantages={advantageSection}
            ctaHref="#bootcamp"
            ctaLabel={t('bootcamp.hero.btnBootcamps', 'Lihat Bootcamp')}
        />
    );
}
