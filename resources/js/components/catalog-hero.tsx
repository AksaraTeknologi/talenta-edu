import { Reveal } from '@/components/home-motion';
import { Button } from '@/components/ui/button';
import { Link } from '@inertiajs/react';
import { ArrowRight, Check, ChevronRight, MessageCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface CatalogHeroAdvantage {
    title: string;
    description?: string;
}

interface CatalogHeroProps {
    /** Label for the current page in the breadcrumb. */
    pageLabel: string;
    eyebrow?: string;
    title: string;
    description: string;
    image: string;
    imageAlt: string;
    advantages: CatalogHeroAdvantage[];
    /** In-page anchor for the primary CTA, e.g. "#bootcamp". */
    ctaHref: string;
    ctaLabel: string;
    whatsappUrl?: string;
    whatsappLabel?: string;
    /** "cutout" for transparent portrait PNG/WebP, "framed" for photos or collages. */
    imageVariant?: 'cutout' | 'framed';
}

const DEFAULT_WHATSAPP = 'https://wa.me/+6285606391730?text=Halo%20Admin%20Talenta,%20saya%20ingin%20konsultasi%20program%20pelatihan.';

export function CatalogHero({
    pageLabel,
    eyebrow,
    title,
    description,
    image,
    imageAlt,
    advantages,
    ctaHref,
    ctaLabel,
    whatsappUrl = DEFAULT_WHATSAPP,
    whatsappLabel,
    imageVariant = 'cutout',
}: CatalogHeroProps) {
    const { t } = useTranslation(['common', 'home']);

    return (
        <section className="w-full overflow-x-clip border-b border-[#E7E2D8] bg-[#FAF8F4]">
            <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 sm:pb-14 lg:px-8">
                {/* Breadcrumb */}
                <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:mb-8 sm:text-sm">
                    <Link href="/" className="hover:text-[#1976D3]">
                        {t('common:nav.home', 'Beranda')}
                    </Link>
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-[#162230]">{pageLabel}</span>
                </nav>

                <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12 lg:gap-12">
                    {/* Copy */}
                    <div className="lg:col-span-7">
                        {eyebrow && (
                            <Reveal immediate y={14} delay={0.04} duration={0.5}>
                                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-3.5 py-1 text-xs font-semibold text-[#B8470A] sm:text-sm">
                                    <span className="h-2 w-2 rounded-full bg-[#D95B16]" aria-hidden="true" />
                                    <span>{eyebrow}</span>
                                </div>
                            </Reveal>
                        )}

                        <Reveal immediate y={22} delay={0.1} duration={0.6}>
                            <h1 className="font-literata text-[30px] leading-[1.15] font-bold tracking-tight text-[#12344E] sm:text-4xl lg:text-[44px]">
                                {title}
                            </h1>
                        </Reveal>

                        <Reveal immediate y={18} delay={0.18} duration={0.6}>
                            <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-[#475569] sm:text-[17px]">{description}</p>
                        </Reveal>

                        <Reveal immediate y={16} delay={0.26} duration={0.55}>
                            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                                <Button asChild size="lg" className="h-12 w-full px-6 text-sm font-semibold sm:w-auto sm:text-base">
                                    <a href={ctaHref}>
                                        {ctaLabel}
                                        <ArrowRight className="h-4 w-4" />
                                    </a>
                                </Button>
                                <Button asChild variant="outline" size="lg" className="h-12 w-full px-6 text-sm font-semibold sm:w-auto sm:text-base">
                                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                                        <MessageCircle className="h-4 w-4 text-[#15803D]" />
                                        {whatsappLabel ?? t('home:hero.ctaSecondary', 'Konsultasi via WhatsApp')}
                                    </a>
                                </Button>
                            </div>
                        </Reveal>
                    </div>

                    {/* Visual */}
                    <div className="hidden lg:col-span-5 lg:block">
                        <Reveal immediate y={20} delay={0.16} duration={0.65}>
                            <div className="relative mx-auto aspect-[5/4] w-full max-w-md overflow-hidden rounded-2xl border border-[#DCE3EC] bg-[#EAF3FC]">
                                {imageVariant === 'cutout' ? (
                                    <>
                                        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-[#12344E]/90" aria-hidden="true" />
                                        <img src={image} alt={imageAlt} className="relative h-full w-full object-contain object-bottom pt-6" />
                                    </>
                                ) : (
                                    <img src={image} alt={imageAlt} className="h-full w-full object-contain p-6" />
                                )}
                            </div>
                        </Reveal>
                    </div>
                </div>

                {/* Advantages strip */}
                {advantages.length > 0 && (
                    <Reveal y={20} delay={0.3} duration={0.6}>
                        <ul className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#DCE3EC] shadow-xs sm:mt-12 sm:grid-cols-2 lg:grid-cols-4">
                            {advantages.map((item) => (
                                <li key={item.title} className="flex gap-3 bg-white px-5 py-4 sm:py-5">
                                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[#12344E] text-white" aria-hidden="true">
                                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-[#162230]">{item.title.replace(/\.\s*$/, '')}</p>
                                        {item.description && <p className="mt-1 text-xs leading-relaxed text-[#5B6B7F] sm:text-[13px]">{item.description}</p>}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </Reveal>
                )}
            </div>
        </section>
    );
}
