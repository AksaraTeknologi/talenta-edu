import { Reveal } from '@/components/home-motion';
import { ProgramCard } from '@/components/program-card';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    duration_days?: number;
    bundle_url?: string;
    category?: Category;
    type: 'course' | 'bootcamp' | 'webinar' | 'bundle' | 'certification-program';
    program_type?: 'regular' | 'scholarship';
    created_at: string;
}

interface MyProductIds {
    courses: string[];
    bootcamps: string[];
    webinars: string[];
    bundles: string[];
    certificationPrograms: string[];
}

interface LatestProductsProps {
    latestProducts: Product[];
    myProductIds: MyProductIds;
}

export default function LatestProductsSection({ latestProducts, myProductIds }: LatestProductsProps) {
    const { t } = useTranslation(['home', 'user']);

    const safeMyProductIds = {
        courses: myProductIds?.courses || [],
        bootcamps: myProductIds?.bootcamps || [],
        webinars: myProductIds?.webinars || [],
        bundles: myProductIds?.bundles || [],
        certificationPrograms: myProductIds?.certificationPrograms || [],
    };

    const hasAccess = (product: Product) => {
        switch (product.type) {
            case 'course':
                return safeMyProductIds.courses.includes(product.id);
            case 'bootcamp':
                return safeMyProductIds.bootcamps.includes(product.id);
            case 'webinar':
                return safeMyProductIds.webinars.includes(product.id);
            case 'bundle':
                return safeMyProductIds.bundles.includes(product.id);
            case 'certification-program':
                return safeMyProductIds.certificationPrograms.includes(product.id);
            default:
                return false;
        }
    };

    const getProductUrl = (product: Product) => {
        const hasProductAccess = hasAccess(product);
        switch (product.type) {
            case 'course':
                return hasProductAccess ? `/profile/my-courses/${product.slug}` : `/course/${product.slug}`;
            case 'bootcamp':
                return hasProductAccess ? `/profile/my-bootcamps/${product.slug}` : `/bootcamp/${product.slug}`;
            case 'webinar':
                return hasProductAccess ? `/profile/my-webinars/${product.slug}` : `/webinar/${product.slug}`;
            case 'bundle':
                return `/bundle/${product.slug}`;
            case 'certification-program':
                return hasProductAccess ? `/profile/my-certification-programs/${product.slug}` : `/certification-program/${product.slug}`;
            default:
                return '#';
        }
    };

    const safeLatestProducts = Array.isArray(latestProducts) ? latestProducts : [];
    const availableProducts = safeLatestProducts.filter((product) => product.type === 'certification-program' || !hasAccess(product));
    const needsBalanceCtaCard = availableProducts.length > 0 && availableProducts.length % 3 === 2;

    const quickLinks = [
        { href: '/bootcamp', label: t('latest.badges.bootcamp', 'Bootcamp') },
        { href: '/webinar', label: t('latest.badges.webinar', 'Webinar') },
        { href: '/course', label: t('latest.badges.course', 'Kelas Online') },
        { href: '/bundle', label: t('latest.badges.bundle', 'Bundling') },
    ];

    return (
        <section id="pelatihan-terbaru" className="w-full scroll-mt-20 border-b border-[#E7E2D8] bg-white py-14 sm:py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Asymmetric Header */}
                <Reveal y={22}>
                    <div className="mb-8 flex flex-col justify-between gap-4 sm:mb-10 lg:flex-row lg:items-end">
                        <div>
                            <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                                {t('latest.popularTitle', 'Jadwal & Pelatihan Terbaru')}
                            </h2>
                            <p className="mt-2 max-w-2xl text-sm text-[#475569] sm:text-base">
                                {t('latest.popularDesc', 'Pilih program sesuai kebutuhan karier akuntansi dan perpajakan Anda.')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {quickLinks.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="inline-flex min-h-10 items-center rounded-lg border border-[#DCE3EC] bg-[#FAF8F4] px-3.5 py-2 text-xs font-medium text-[#12344E] transition-colors hover:border-[#1976D3] hover:bg-[#EAF3FC] hover:text-[#1976D3] sm:text-sm"
                                >
                                    {item.label}
                                </Link>
                            ))}
                            <Link
                                href="/bootcamp"
                                className="inline-flex min-h-10 items-center gap-1.5 px-2 text-sm font-semibold text-[#1976D3] hover:underline"
                            >
                                <span>{t('latest.viewAll', 'Lihat Semua Program')}</span>
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </Reveal>

                {/* Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {safeLatestProducts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-4 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] py-12">
                            <img src="/assets/images/not-found.webp" alt={t('latest.empty', 'Produk Belum Tersedia')} className="w-40" />
                            <div className="text-center text-sm text-[#475569]">{t('latest.empty', 'Belum ada produk yang tersedia saat ini.')}</div>
                        </div>
                    ) : availableProducts.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] px-6 py-12 text-center">
                            <div className="text-lg font-semibold text-[#12344E]">
                                {t('latest.allOwned', 'Anda sudah memiliki akses semua produk terbaru kami.')}
                            </div>
                            <p className="text-sm text-[#475569]">
                                {t('latest.thankYou', 'Terima kasih telah menjadi bagian dari Talenta Academy!')}
                            </p>
                        </div>
                    ) : (
                        <>
                            {availableProducts.map((product, idx) => (
                                <Reveal key={product.id} y={28} delay={Math.min(idx * 0.08, 0.4)} className="h-full">
                                    <ProgramCard product={product} href={getProductUrl(product)} hasAccess={hasAccess(product)} />
                                </Reveal>
                            ))}

                            {needsBalanceCtaCard && (
                                <Reveal y={28} delay={Math.min(availableProducts.length * 0.08, 0.4)} className="h-full">
                                    <div className="flex h-full flex-col justify-between rounded-xl border border-dashed border-[#B8C5D6] bg-[#FAF8F4] p-6">
                                        <div>
                                            <span className="inline-block rounded-md border border-[#BFDBFE] bg-[#EAF3FC] px-2.5 py-0.5 text-xs font-semibold text-[#155FA8]">
                                                {t('latest.catalogLabel', 'Katalog Lengkap')}
                                            </span>
                                            <h3 className="font-literata mt-4 text-xl font-bold text-[#12344E]">
                                                {t('latest.exploreMoreTitle', 'Lihat Semua Pelatihan Lainnya')}
                                            </h3>
                                            <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                                                {t(
                                                    'latest.exploreMoreDesc',
                                                    'Jelajahi jadwal Brevet AB, webinar perpajakan, kelas online mandiri, dan paket bundling hemat.',
                                                )}
                                            </p>
                                        </div>

                                        <div className="mt-6 flex flex-col gap-2">
                                            <Button asChild size="lg" className="w-full justify-between">
                                                <Link href="/bootcamp">
                                                    <span>{t('latest.viewAllBootcamp', 'Jelajahi Bootcamp')}</span>
                                                    <ArrowRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <Button asChild variant="outline" className="h-10 text-xs">
                                                    <Link href="/webinar">{t('latest.badges.webinar', 'Webinar')}</Link>
                                                </Button>
                                                <Button asChild variant="outline" className="h-10 text-xs">
                                                    <Link href="/course">{t('latest.badges.course', 'Kelas Online')}</Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </Reveal>
                            )}
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}
