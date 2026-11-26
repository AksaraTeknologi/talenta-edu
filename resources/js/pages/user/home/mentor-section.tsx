import { EASE_OUT_EXPO, Reveal, VIEWPORT_ONCE } from '@/components/home-motion';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { useTranslation } from 'react-i18next';

interface Mentor {
    id: number;
    name: string;
    role: string;
    image: string;
}

const mentorsData: Mentor[] = [
    {
        id: 1,
        name: 'Fajar Nurdin, M.Ak., BKP.',
        role: 'Mentor Perpajakan',
        image: '/assets/images/mentors/fajar.png',
    },
    {
        id: 2,
        name: 'Citra Kharisma Utami, S.E., M.Ak.',
        role: 'Mentor Perpajakan',
        image: '/assets/images/mentors/citra.png',
    },
    {
        id: 3,
        name: 'Rizki Indrawan, M.Ak., Ak.',
        role: 'Mentor Perpajakan',
        image: '/assets/images/mentors/rizki.png',
    },
    {
        id: 4,
        name: 'Wildan Dwi Dermawan, M.Ak.',
        role: 'Mentor Perpajakan',
        image: '/assets/images/mentors/wildan.png',
    },
];

const MentorCard = ({ mentor }: { mentor: Mentor }) => {
    const { t } = useTranslation('home');

    return (
        <section className="relative mx-auto h-[370px] w-full max-w-xs overflow-hidden rounded-[20px] sm:max-w-sm md:max-w-md lg:w-[300px] shadow-lg">
            {/* Blue Side Bar with "MENTOR" text */}
            <div className="absolute left-0 top-0 h-full w-[70px] rounded-[20px_0px_0px_20px] bg-[#1976d3] sm:w-[90px]">
                <div className="absolute left-1/2 top-1/3 flex -translate-x-1/2 -translate-y-1/2 -rotate-90 items-center justify-center">
                    <span className="whitespace-nowrap font-literata font-bold text-3xl uppercase leading-none text-primary sm:text-5xl" style={{ WebkitTextStroke: '0.5px white' }}>
                        {t('mentor.badge', 'MENTOR')}
                    </span>
                </div>
            </div>
            {/* Mentor Image */}
            <div className="absolute bottom-0 right-0 h-[340px] w-[220px]">
                <img
                    className="h-full w-full object-cover object-top"
                    alt={`${mentor.name} - ${mentor.role}`}
                    src={mentor.image}
                    onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.name)}&background=1976d3&color=fff&size=400`;
                    }}
                />
            </div>
            {/* Gradient Overlay at bottom */}
            <div className="absolute bottom-0 left-0 h-[80px] w-full bg-[linear-gradient(180deg,rgba(25,118,211,0)_0%,rgba(25,118,211,1)_26%)] shadow-[0px_4px_4px_rgba(0,0,0,0.25)] sm:h-[120px]" />
            {/* Mentor Name */}
            <h3 className="absolute bottom-[38px] left-0 w-full px-4 text-left font-bold text-lg leading-tight text-white sm:bottom-[45px] sm:px-6 sm:text-[28px]">
                {mentor.name}
            </h3>
            {/* Mentor Role */}
            <p className="absolute bottom-[16px] left-0 w-full px-4 text-left font-normal text-xs text-white/90 sm:bottom-[20px] sm:px-6 sm:text-[14px]">
                {mentor.role === 'Mentor Perpajakan' ? t('mentor.roleTax', mentor.role) : mentor.role}
            </p>
        </section>
    );
};

export default function MentorSection() {
    const { t } = useTranslation('home');
    const prefersReducedMotion = useReducedMotion();

    return (
        <section className="w-full border-b border-[#DCE3EC] bg-[#F2F6FA] py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <Reveal y={22}>
                    <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                                {t('mentor.title', 'Belajar Bersama Mentor Praktisi')}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm text-[#475569] sm:text-base">
                                {t('mentor.subtitle', 'Dibimbing langsung oleh praktisi, akademisi, dan konsultan pajak berpengalaman.')}
                            </p>
                        </div>
                        <Link
                            href="/mentor"
                            className="inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-[#1976D3] hover:underline"
                        >
                            <span>{t('mentor.viewAll', 'Lihat Semua Mentor')}</span>
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </Reveal>

                {/* Mentor Cards Grid */}
                <div className="grid grid-cols-1 gap-8 justify-items-center sm:grid-cols-2 lg:grid-cols-4">
                    {mentorsData.map((mentor, idx) => (
                        <motion.div
                            key={mentor.id}
                            initial={prefersReducedMotion ? false : { opacity: 0, y: 34, scale: 0.96 }}
                            whileInView={{ opacity: 1, y: 0, scale: 1 }}
                            viewport={VIEWPORT_ONCE}
                            transition={{ duration: 0.6, delay: idx * 0.09, ease: EASE_OUT_EXPO }}
                            whileHover={prefersReducedMotion ? undefined : { y: -6 }}
                            className="w-full"
                        >
                            <MentorCard mentor={mentor} />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
