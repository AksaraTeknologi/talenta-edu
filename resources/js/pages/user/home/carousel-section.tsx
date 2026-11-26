import { CountUpNumber, EASE_OUT_EXPO, Reveal } from '@/components/home-motion';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

const heroMentors = [
    {
        name: 'Fajar Nurdin, M.Ak., BKP.',
        roleKey: 'mentor.roleConsultant',
        defaultRole: 'Konsultan Pajak (BKP)',
        image: '/assets/images/mentors/fajar.png',
    },
    {
        name: 'Citra Kharisma Utami, S.E., M.Ak.',
        roleKey: 'mentor.rolePractitioner',
        defaultRole: 'Praktisi Akuntansi & Pajak',
        image: '/assets/images/mentors/citra.png',
    },
    {
        name: 'Rizki Indrawan, M.Ak., Ak.',
        roleKey: 'mentor.rolePractitioner',
        defaultRole: 'Praktisi Akuntansi & Pajak',
        image: '/assets/images/mentors/rizki.png',
    },
    {
        name: 'Wildan Dwi Dermawan, M.Ak.',
        roleKey: 'mentor.rolePractitioner',
        defaultRole: 'Praktisi Akuntansi & Pajak',
        image: '/assets/images/mentors/wildan.png',
    },
];

export default function CarouselSection() {
    const { t, i18n } = useTranslation('home');
    const locale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const sectionRef = useRef<HTMLElement>(null);
    const prefersReducedMotion = useReducedMotion();

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ['start start', 'end start'],
    });
    const smoothProgress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
    const leftColY = useTransform(smoothProgress, [0, 1], [0, -16]);
    const rightColY = useTransform(smoothProgress, [0, 1], [0, 16]);

    const stats = [
        { target: 30, suffix: '+', label: t('about.onlineTraining', 'Pelatihan Online') },
        { target: 15992, suffix: '+', label: t('about.trainedAlumni', 'Alumni & Peserta Terlatih') },
        { target: 15, suffix: '+', label: t('about.partners', 'Partner Kerjasama') },
        { target: 98, suffix: '%', label: t('about.satisfaction', 'Kepuasan Peserta') },
    ];

    return (
        <section ref={sectionRef} className="w-full overflow-x-clip border-b border-[#E7E2D8] bg-[#FAF8F4] pt-8 pb-10 sm:pt-12 sm:pb-14">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
                    {/* Left: Editorial Copy & CTAs */}
                    <div className="lg:col-span-7">
                        <Reveal immediate y={14} delay={0.04} duration={0.5}>
                            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-3.5 py-1 text-xs font-semibold text-[#B8470A] sm:text-sm">
                                <span className="h-2 w-2 rounded-full bg-[#D95B16]" aria-hidden="true" />
                                <span>{t('hero.eyebrow', 'Lembaga Pelatihan Pajak & Akuntansi')}</span>
                            </div>
                        </Reveal>

                        <Reveal immediate y={24} delay={0.12} duration={0.65}>
                            <h1 className="font-literata text-[30px] leading-[1.15] font-bold tracking-tight text-[#12344E] sm:text-4xl lg:text-[44px]">
                                {t('hero.title', 'Kuasai Pajak, Brevet, dan Akuntansi Siap Kerja')}
                            </h1>
                        </Reveal>

                        <Reveal immediate y={20} delay={0.22} duration={0.6}>
                            <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-[#475569] sm:text-[17px]">
                                {t(
                                    'hero.subtitle',
                                    'Program Brevet AB, akuntansi, audit, serta praktik Accurate dan Zahir melalui bootcamp, webinar, dan kelas online bersama praktisi aktif.',
                                )}
                            </p>
                        </Reveal>

                        <Reveal immediate y={18} delay={0.32} duration={0.55}>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Button asChild size="lg" className="h-12 w-full px-6 text-sm font-semibold sm:w-auto sm:text-base">
                                    <a href="#pelatihan-terbaru">
                                        {t('hero.ctaPrimary', 'Lihat Jadwal Pelatihan')}
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="h-12 w-full px-6 text-sm font-semibold sm:w-auto sm:text-base">
                                    <a
                                        href="https://wa.me/+6285606391730?text=Halo%20Admin%20Talenta,%20saya%20ingin%20konsultasi%20program%20pelatihan."
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <MessageCircle className="h-4 w-4 text-[#15803D]" />
                                        {t('hero.ctaSecondary', 'Konsultasi via WhatsApp')}
                                    </a>
                                </Button>
                            </div>
                        </Reveal>
                    </div>

                    {/* Right: Real Mentor Portraits Composition (swappable 1-block visual) */}
                    <div className="lg:col-span-5">
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {heroMentors.map((mentor, idx) => (
                                <motion.div
                                    key={mentor.name}
                                    initial={prefersReducedMotion ? false : { opacity: 0, y: 26, scale: 0.96 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.6, delay: 0.16 + idx * 0.08, ease: EASE_OUT_EXPO }}
                                    whileHover={prefersReducedMotion ? undefined : { y: -4 }}
                                    style={prefersReducedMotion ? undefined : { y: idx % 2 === 0 ? leftColY : rightColY }}
                                    className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-xs transition-shadow hover:shadow-md"
                                >
                                    <div className="aspect-[4/3] w-full overflow-hidden border-b border-[#EEF2F6] bg-[#EEF3F8]">
                                        <img
                                            src={mentor.image}
                                            alt={mentor.name}
                                            className="h-full w-full object-contain object-bottom pt-2"
                                        />
                                    </div>
                                    <div className="px-3 py-2.5">
                                        <p className="truncate text-xs font-semibold text-[#162230] sm:text-sm">{mentor.name}</p>
                                        <p className="truncate text-[11px] font-medium text-[#5B6B7F] sm:text-xs">
                                            {t(mentor.roleKey, mentor.defaultRole)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Integrated Proof Bar */}
                <Reveal y={24} delay={0.36} duration={0.65}>
                    <div className="mt-8 grid grid-cols-2 divide-y divide-[#E2E8F0] rounded-xl border border-[#DCE3EC] bg-white shadow-xs sm:mt-10 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
                        {stats.map((stat, idx) => (
                            <div
                                key={stat.label}
                                className={`flex flex-col justify-center px-5 py-4 sm:px-6 sm:py-5 ${
                                    idx % 2 === 1 ? 'border-l border-[#E2E8F0] lg:border-l-0' : ''
                                }`}
                            >
                                <p className="font-literata text-2xl font-bold text-[#12344E] tabular-nums sm:text-3xl">
                                    <CountUpNumber target={stat.target} suffix={stat.suffix} locale={locale} />
                                </p>
                                <p className="mt-1 text-xs font-medium text-[#475569] sm:text-sm">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </Reveal>
            </div>
        </section>
    );
}
