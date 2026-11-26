import { Reveal } from '@/components/home-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function FaqSection() {
    const { t } = useTranslation('home');
    const [expanded, setExpanded] = useState<React.Key | null>('getting-started');

    return (
        <section className="w-full bg-white py-14 sm:py-20">
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
                {/* Left Column */}
                <Reveal y={24} className="lg:col-span-4">
                    <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                        {t('faq.title', 'Pertanyaan yang Sering Ditanyakan')}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-[#475569] sm:text-base">
                        {t(
                            'faq.description',
                            'Belajar pajak, brevet, atau akuntansi kadang bikin bingung sendiri, apalagi kalau materinya banyak dan teknis banget! Punya pertanyaan seputar webinar, kelas online, atau sertifikasi pajak dan akuntansi?',
                        )}
                    </p>

                    <div className="mt-6 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-5">
                        <p className="text-sm font-semibold text-[#12344E]">
                            {t('faq.helpTitle', 'Masih ada pertanyaan lain?')}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                            {t('faq.helpDesc', 'Tim admin kami siap membantu memilihkan program yang paling sesuai.')}
                        </p>
                        <Button asChild variant="outline" size="lg" className="mt-4 h-11 w-full justify-center">
                            <a
                                href="https://wa.me/+6285606391730?text=Halo%20Admin%20Talenta,%20saya%20ingin%20bertanya%20tentang%20program%20pelatihan."
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <MessageCircle className="h-4 w-4 text-[#15803D]" />
                                {t('hero.ctaSecondary', 'Konsultasi via WhatsApp')}
                            </a>
                        </Button>
                    </div>
                </Reveal>

                {/* Right Column */}
                <div className="lg:col-span-8">
                    <Accordion
                        className="flex w-full flex-col gap-3"
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        expandedValue={expanded}
                        onValueChange={setExpanded}
                    >
                        <Reveal y={20} delay={0} duration={0.5}>
                            <AccordionItem value="getting-started" className="rounded-xl border border-[#DCE3EC] bg-white px-5 py-1">
                                <AccordionTrigger className="min-h-11 w-full py-3.5 text-left text-[#162230] hover:cursor-pointer">
                                    <div className="flex w-full items-center justify-between gap-4">
                                        <p className="text-sm font-semibold text-[#12344E] sm:text-base">
                                            {t('faq.q1', 'Apa itu Talenta Academy?')}
                                        </p>
                                        <ChevronDown className="h-5 w-5 shrink-0 text-[#1976D3] transition-transform duration-200 group-data-expanded:rotate-180" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="pt-1 pb-4 text-sm leading-relaxed text-[#475569] sm:text-[15px]">
                                        {t(
                                            'faq.a1',
                                            'Talenta Academy adalah lembaga pelatihan profesional yang fokus pada pengembangan kompetensi di bidang akuntansi, perpajakan, audit, dan software akuntansi, dll dengan pendekatan praktis dan aplikatif.',
                                        )}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Reveal>

                        <Reveal y={20} delay={0.07} duration={0.5}>
                            <AccordionItem value="animation-properties" className="rounded-xl border border-[#DCE3EC] bg-white px-5 py-1">
                                <AccordionTrigger className="min-h-11 w-full py-3.5 text-left text-[#162230] hover:cursor-pointer">
                                    <div className="flex w-full items-center justify-between gap-4">
                                        <p className="text-sm font-semibold text-[#12344E] sm:text-base">
                                            {t('faq.q2', 'Apa saja program dan fitur di Talenta Academy?')}
                                        </p>
                                        <ChevronDown className="h-5 w-5 shrink-0 text-[#1976D3] transition-transform duration-200 group-data-expanded:rotate-180" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="pt-1 pb-4 text-sm leading-relaxed text-[#475569] sm:text-[15px]">
                                        {t(
                                            'faq.a2',
                                            'Talenta Academy menyediakan berbagai program pembelajaran seperti Kelas Online, Bootcamp, serta pelatihan berbasis Webinar. Setiap program dirancang secara interaktif dan aplikatif untuk membantu peserta mengembangkan keterampilan secara optimal dan siap diterapkan di dunia kerja.',
                                        )}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Reveal>

                        <Reveal y={20} delay={0.14} duration={0.5}>
                            <AccordionItem value="advanced-usage" className="rounded-xl border border-[#DCE3EC] bg-white px-5 py-1">
                                <AccordionTrigger className="min-h-11 w-full py-3.5 text-left text-[#162230] hover:cursor-pointer">
                                    <div className="flex w-full items-center justify-between gap-4">
                                        <p className="text-sm font-semibold text-[#12344E] sm:text-base">
                                            {t('faq.q3', 'Bagaimana alur belajar di Talenta?')}
                                        </p>
                                        <ChevronDown className="h-5 w-5 shrink-0 text-[#1976D3] transition-transform duration-200 group-data-expanded:rotate-180" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="pt-1 pb-4 text-sm leading-relaxed text-[#475569] sm:text-[15px]">
                                        {t(
                                            'faq.a3',
                                            'Pendaftaran dapat dilakukan melalui website resmi Talenta Academy atau dengan menghubungi admin melalui WhatsApp yang tersedia di website atau DM di IG @brevetpajak_talenta.',
                                        )}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Reveal>

                        <Reveal y={20} delay={0.21} duration={0.5}>
                            <AccordionItem value="community-and-support" className="rounded-xl border border-[#DCE3EC] bg-white px-5 py-1">
                                <AccordionTrigger className="min-h-11 w-full py-3.5 text-left text-[#162230] hover:cursor-pointer">
                                    <div className="flex w-full items-center justify-between gap-4">
                                        <p className="text-sm font-semibold text-[#12344E] sm:text-base">
                                            {t('faq.q4', 'Ke mana saya bisa mendapatkan informasi kerjasama atau bantuan jika ada kendala?')}
                                        </p>
                                        <ChevronDown className="h-5 w-5 shrink-0 text-[#1976D3] transition-transform duration-200 group-data-expanded:rotate-180" />
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    <p className="pt-1 pb-4 text-sm leading-relaxed text-[#475569] sm:text-[15px]">
                                        {t('faq.a4_part1', 'Untuk informasi lebih lanjut mengenai Talenta Academy, silakan menghubungi admin kami melalui WhatsApp ')}
                                        <a href="https://wa.me/+6285606391730" className="font-semibold text-[#1976D3] hover:underline">
                                            {t('faq.a4_phone', '+6285606391730')}
                                        </a>
                                        {t(
                                            'faq.a4_part2',
                                            '. Kami juga aktif di berbagai media sosial, jadi pastikan untuk mengikuti Talenta Academy di Instagram, TikTok, dan LinkedIn untuk mendapatkan update terbaru serta tips seputar akuntansi dan perpajakan.',
                                        )}
                                    </p>
                                </AccordionContent>
                            </AccordionItem>
                        </Reveal>
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
