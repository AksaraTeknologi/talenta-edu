import { EASE_OUT_EXPO, ScrollProgressBar } from '@/components/home-motion';
import PromotionPopup from '@/components/promotion-popup';
import UserLayout from '@/layouts/user-layout';
import { Head } from '@inertiajs/react';
import { motion, MotionConfig } from 'motion/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import CarouselSection from './carousel-section';
import FaqSection from './faq-section';
import LatestProductsSection from './latest-products-section';
import MentorSection from './mentor-section';
import TestimonySection from './testimony-section';

interface Tool {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface Category {
    id: string;
    name: string;
}

interface Product {
    id: string;
    title: string;
    thumbnail: string;
    slug: string;
    strikethrough_price: number;
    price: number;
    level?: 'beginner' | 'intermediate' | 'advanced';
    start_date?: string;
    end_date?: string;
    start_time?: string;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
    program_type?: 'regular' | 'scholarship';
    duration_days?: number;
    bundle_url?: string;
    category?: Category;
    type: 'course' | 'bootcamp' | 'webinar' | 'bundle' | 'certification-program';
    created_at: string;
}

interface MyProductIds {
    courses: string[];
    bootcamps: string[];
    webinars: string[];
    bundles: string[];
    certificationPrograms: string[];
}

interface ReferralInfo {
    code?: string;
    hasActive: boolean;
}

interface Promotion {
    id: string;
    promotion_flyer: string;
    start_date: string;
    end_date: string;
    url_redirect?: string;
    is_active: boolean;
}

interface HomeProps {
    tools: Tool[];
    latestProducts: Product[];
    myProductIds: MyProductIds;
    allProducts: Array<{
        id: string;
        title: string;
        type: 'course' | 'bootcamp' | 'webinar' | 'bundle' | 'certification-program';
        price: number;
    }>;
    activePromotion?: Promotion | null;
    referralInfo: ReferralInfo;
}

export default function Home({ latestProducts, myProductIds, activePromotion, referralInfo }: HomeProps) {
    const { t } = useTranslation(['home', 'common']);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const refFromUrl = urlParams.get('ref');

        if (refFromUrl) {
            sessionStorage.setItem('referral_code', refFromUrl);
        } else if (referralInfo.code) {
            sessionStorage.setItem('referral_code', referralInfo.code);
        }
    }, [referralInfo]);

    return (
        <UserLayout>
            <Head title={t('common:nav.home', 'Beranda')} />

            <MotionConfig reducedMotion="user">
                <ScrollProgressBar />

                {activePromotion && <PromotionPopup promotion={activePromotion} suppressDuration={3} />}

                <CarouselSection />
                <LatestProductsSection latestProducts={latestProducts} myProductIds={myProductIds} />
                <MentorSection />
                <TestimonySection />
                <FaqSection />

                <motion.a
                    href="https://wa.me/+6285606391730?text=Halo%20Admin%20Talenta,%20saya%20ingin%20bertanya%20tentang%20kelas%20online."
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ opacity: 0, scale: 0.85, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.45, ease: EASE_OUT_EXPO }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.94 }}
                    className="fixed right-4 bottom-24 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE3EC] bg-white shadow-md transition-colors hover:bg-[#EAF3FC] md:right-8 md:h-14 md:w-14 lg:right-8 lg:bottom-6"
                    aria-label="Chat WhatsApp"
                >
                    <img src="/assets/images/wa-icon.webp" alt="WhatsApp" className="h-7 w-7 md:h-8 md:w-8" />
                </motion.a>
            </MotionConfig>
        </UserLayout>
    );
}
