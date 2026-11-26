import { EASE_OUT_EXPO, Reveal } from '@/components/home-motion';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Testimonial {
    name: string;
    role: string;
    image: string;
    text: string;
}

const testimonials: Testimonial[] = [
    {
        name: 'Renandia Ridhaning Pangesti',
        role: 'Mahasiswa',
        image: '/assets/images/Renandia-Ridhaning-Pangesti.jpg',
        text: 'Sebagai mahasiswa, mengikuti Brevet AB di Talenta sangat membantu saya memahami perpajakan secara aplikatif, tidak hanya teori. Materinya terstruktur, relevan, dan meningkatkan kesiapan saya menghadapi dunia kerja.',
    },
    {
        name: 'Silva Pardah Aulia',
        role: 'Peserta Brevet Pajak AB',
        image: '/assets/images/Silva-Pardah-Aulia.jpg',
        text: 'Kelas Brevet Pajak AB memberikan pengalaman belajar yang komprehensif. Saya merasa lebih percaya diri dalam mengerjakan administrasi dan pelaporan pajak setelah mengikuti pelatihan ini serta banyak mendapatkan pelajaran yang baru wawasan dan teman diskusi yang menyenangkan',
    },
    {
        name: 'Jonathan Dorman Christobal',
        role: 'Peserta Brevet AB',
        image: '/assets/images/Jonathan-Dorman.jpg',
        text: 'Kesan saya selama mengikuti Brevet AB di Talenta sangat positif. Para pengajar mampu menyampaikan materi dengan jelas, menggunakan bahasa yang mudah dipahami, sehingga saya dapat memahami konsep perpajakan, baik untuk Wajib Pajak Orang Pribadi maupun Badan, dengan lebih baik dan mendalam',
    },
    {
        name: 'St. Nur Adibah',
        role: 'Peserta Kelas Software Akuntansi',
        image: '/assets/images/St.-Nur-Adibah.jpg',
        text: 'Instruktur komunikatif dan sabar. Setelah ikut kelas software akuntansi, input transaksi jadi lebih rapi dan cepat. Pelatihan aplikatif dan sesuai kebutuhan kerja sehari-hari. Sangat direkomendasikan bagi siapa pun yang ingin meningkatkan skill software akuntansi.',
    },
    {
        name: 'Elia Kurniawati',
        role: 'Peserta Akuntansi Intermediate',
        image: '/assets/images/Elia-Kurniawati.jpg',
        text: 'Pelatihan Akuntansi Intermediate ini sangat membantu meningkatkan pemahaman saya dalam penyusunan laporan keuangan dan pelaporan perpajakan. Materi disampaikan secara runtut dan mudah dipahami, dilengkapi dengan praktik Excel yang sangat aplikatif. Ilmunya langsung bisa diterapkan dalam pekerjaan sehari-hari.',
    },
    {
        name: 'Nelissa Lenjau',
        role: 'Peserta Pelatihan Jago Audit',
        image: '/assets/images/Nelissa-Lenjau.jpg',
        text: 'Pelatihan Jago Audit sangat membantu saya memahami proses audit secara menyeluruh, baik audit internal maupun audit eksternal. Materi disampaikan secara sistematis mulai dari perencanaan, pelaksanaan, hingga pelaporan audit. Pembahasan Audit ATLAS juga sangat aplikatif dan sesuai dengan praktik yang digunakan saat ini.',
    },
    {
        name: 'Merta Kurniawan',
        role: 'Praktisi Akuntansi',
        image: '/assets/images/Merta-Kurniawan.jpg',
        text: 'Materi yang diberikan sangat lengkap dan mudah diikuti, baik untuk pemula maupun yang sudah bekerja di bidang akuntansi. Setelah mengikuti pelatihan, pekerjaan pencatatan transaksi dan pembuatan laporan keuangan menjadi lebih cepat, rapi, dan terstruktur.',
    },
    {
        name: 'Ryco Tarnuwardhana Putra, S.AP.',
        role: 'Profesional',
        image: '/assets/images/Ryco-Tarnuwardhana-Putra.jpg',
        text: 'Pelatihan yang komprehensif dan aplikatif. Tidak hanya teori, tetapi juga banyak praktik langsung yang relevan dengan kondisi di lapangan. Setelah mengikuti kelas ini, saya menjadi lebih percaya diri dalam menyusun laporan keuangan dan melakukan pelaporan pajak.',
    },
    {
        name: 'Amanda Putri',
        role: 'Peserta Kelas Akuntansi',
        image: '/assets/images/Amanda-Putri.jpg',
        text: 'Mengikuti kelas akuntansi jasa, dagang, dan manufaktur sangat membantu saya memahami pencatatan dan penyusunan laporan keuangan secara menyeluruh. Materi disampaikan jelas, aplikatif, dan relevan dengan praktik di dunia kerja.',
    },
    {
        name: 'Nisa Aulia Firnanda',
        role: 'Peserta Sertifikasi CFTR',
        image: '/assets/images/Nisa-Aulia-Firnanda.jpeg',
        text: 'Pelatihan Sertifikasi CFTR sangat membantu saya memahami ketentuan dan praktik perpajakan secara komprehensif. Materi disampaikan jelas, terstruktur, dan sesuai dengan kebutuhan sertifikasi.',
    },
    {
        name: 'Fransisko Caserio Daur',
        role: 'Peserta Brevet AB',
        image: '/assets/images/Fransisko-Caserio-Daur.jpeg',
        text: 'Secara keseluruhan, kesan setelah mengikuti Brevet AB di Talenta ini adalah sangat positif dan memberdayakan. Saya merasa lebih siap dan kompeten dalam menghadapi berbagai aspek perpajakan, serta mendapatkan nilai tambah signifikan untuk perkembangan karier dan pemahaman pribadi.',
    },
];

function TestimonyAvatar({ testimonial, className }: { testimonial: Testimonial; className?: string }) {
    const getInitials = useInitials();
    const [failed, setFailed] = useState(false);

    if (failed) {
        return (
            <span
                className={cn('flex shrink-0 items-center justify-center rounded-full bg-[#EAF3FC] font-semibold text-[#12344E]', className)}
                aria-hidden="true"
            >
                {getInitials(testimonial.name)}
            </span>
        );
    }

    return (
        <img
            src={testimonial.image}
            alt=""
            loading="lazy"
            onError={() => setFailed(true)}
            className={cn('shrink-0 rounded-full border border-[#DCE3EC] object-cover', className)}
        />
    );
}

const AUTOPLAY_MS = 7000;

export default function TestimonySection() {
    const { t } = useTranslation('home');
    const prefersReducedMotion = useReducedMotion();
    const [active, setActive] = useState(0);
    const [paused, setPaused] = useState(false);
    const total = testimonials.length;

    const go = (next: number) => setActive((next + total) % total);

    useEffect(() => {
        if (paused || prefersReducedMotion) return;
        const timer = setTimeout(() => setActive((i) => (i + 1) % total), AUTOPLAY_MS);
        return () => clearTimeout(timer);
    }, [active, paused, prefersReducedMotion, total]);

    const current = testimonials[active];
    const upcoming = [1, 2, 3].map((offset) => (active + offset) % total);

    return (
        <section className="w-full border-b border-[#E7E2D8] bg-[#FAF8F4] py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <Reveal y={22}>
                    <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
                        <div>
                            <p className="mb-2 text-xs font-semibold tracking-wider text-[#5B6B7F] uppercase sm:text-sm">
                                {t('testimony.subtitle', 'What our customers say about us')}
                            </p>
                            <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">{t('testimony.title', 'Testimonials')}</h2>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-[#5B6B7F] tabular-nums" aria-live="polite">
                                {String(active + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
                            </span>
                            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => go(active - 1)} aria-label="Previous testimonial">
                                <ChevronLeft className="h-5 w-5" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-10 w-10" onClick={() => go(active + 1)} aria-label="Next testimonial">
                                <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </Reveal>

                <Reveal y={28} delay={0.1} duration={0.65}>
                    <div
                        className="grid grid-cols-1 gap-6 lg:grid-cols-12"
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        onFocusCapture={() => setPaused(true)}
                        onBlurCapture={() => setPaused(false)}
                    >
                        {/* Featured quote */}
                        <figure className="relative flex min-h-[320px] flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white p-6 shadow-xs sm:p-8 lg:col-span-8 lg:p-10">
                            <span className="font-literata pointer-events-none absolute -top-4 right-6 text-[120px] leading-none text-[#FFE4D1] select-none" aria-hidden="true">
                                &ldquo;
                            </span>
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={active}
                                    initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                                    transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                                    className="relative flex flex-1 flex-col"
                                >
                                    <blockquote className="font-literata text-lg leading-relaxed text-[#162230] sm:text-xl lg:text-[22px] lg:leading-[1.6]">
                                        {current.text}
                                    </blockquote>
                                    <figcaption className="mt-auto flex items-center gap-4 border-t border-[#F1F5F9] pt-6">
                                        <TestimonyAvatar testimonial={current} className="h-14 w-14 text-base" />
                                        <div>
                                            <p className="text-base font-semibold text-[#162230]">{current.name}</p>
                                            <p className="text-sm text-[#5B6B7F]">{current.role}</p>
                                        </div>
                                    </figcaption>
                                </motion.div>
                            </AnimatePresence>
                        </figure>

                        {/* Up next */}
                        <ul className="hidden flex-col gap-3 lg:col-span-4 lg:flex">
                            {upcoming.map((idx) => {
                                const item = testimonials[idx];
                                return (
                                    <li key={item.name} className="flex-1">
                                        <button
                                            type="button"
                                            onClick={() => go(idx)}
                                            className="group flex h-full w-full flex-col gap-3 rounded-xl border border-[#DCE3EC] bg-white/60 p-4 text-left transition-colors hover:border-[#93C5FD] hover:bg-white focus-visible:ring-2 focus-visible:ring-[#1976D3] focus-visible:outline-none"
                                        >
                                            <span className="flex items-center gap-3">
                                                <TestimonyAvatar testimonial={item} className="h-10 w-10 text-xs" />
                                                <span className="min-w-0">
                                                    <span className="block truncate text-sm font-semibold text-[#162230] group-hover:text-[#1976D3]">{item.name}</span>
                                                    <span className="block truncate text-xs text-[#5B6B7F]">{item.role}</span>
                                                </span>
                                            </span>
                                            <span className="line-clamp-2 text-sm leading-relaxed text-[#475569]">{item.text}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </Reveal>

                {/* Progress dots (mobile & tablet) */}
                <div className="mt-6 flex justify-center gap-1.5 lg:hidden">
                    {testimonials.map((item, idx) => (
                        <button
                            key={item.name}
                            type="button"
                            onClick={() => go(idx)}
                            aria-label={`${idx + 1}`}
                            aria-current={idx === active}
                            className={cn('h-1.5 rounded-full transition-all', idx === active ? 'w-6 bg-[#12344E]' : 'w-1.5 bg-[#CBD5E1]')}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}
