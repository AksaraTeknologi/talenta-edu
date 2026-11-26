import { CatalogHero } from '@/components/catalog-hero';
import { useTranslation } from 'react-i18next';

export default function HeroSection() {
    const { t } = useTranslation(['user', 'common', 'home']);

    const advantageSection = [
        {
            title: t('course.hero.adv1Title', 'Pembelajaran Bertahap & Terstruktur.'),
            description: t('course.hero.adv1Desc', 'Materi disampaikan dalam beberapa sesi untuk memastikan pemahaman peserta terbentuk secara mendalam.'),
        },
        {
            title: t('course.hero.adv2Title', 'Akses Fleksibel'),
            description: t('course.hero.adv2Desc', 'Kelas dapat diikuti dari mana saja melalui platform online yang mudah digunakan.'),
        },
        {
            title: t('course.hero.adv3Title', 'Interaktif & Praktis.'),
            description: t('course.hero.adv3Desc', 'Terdapat diskusi, tanya jawab, dan latihan sehingga peserta aktif dan tidak hanya menerima teori.'),
        },
        {
            title: t('course.hero.adv4Title', 'Didukung Materi Pembelajaran.'),
            description: t('course.hero.adv4Desc', 'Pembelajaran berbasis praktik dan studi kasus nyata sehingga skill yang diperoleh siap diterapkan di dunia kerja. Peserta mendapatkan modul dan bahan pendukung untuk memperkuat pemahaman di setiap pertemuan.'),
        },
    ];

    return (
        <CatalogHero
            pageLabel={t('common:nav.course', 'Kelas Online')}
            eyebrow={t('course.hero.advantagesTitle', 'Online Class Profesional Talenta Academy')}
            title={`${t('course.hero.mainTitle1', 'Belajar Mudah')}${t('course.hero.mainTitle2', ' dengan Akses Selamanya.')}`}
            description={t('course.hero.description', 'Online Class Program merupakan kelas daring yang dilaksanakan dalam beberapa sesi dan pertemuan terstruktur untuk memantapkan pemahaman peserta. Didukung materi terarah, diskusi interaktif, dan praktik aplikatif, program ini dirancang agar peserta benar-benar menguasai materi secara bertahap dan berkelanjutan.')}
            image="/assets/images/hero-course.webp"
            imageAlt={t('course.hero.title', 'Online Class Program')}
            advantages={advantageSection}
            ctaHref="#courses-section"
            ctaLabel={t('course.hero.btnCourses', 'Lihat Kelas Online')}
        />
    );
}
