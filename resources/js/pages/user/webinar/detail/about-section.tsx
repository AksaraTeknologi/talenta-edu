import { parseList, resolveStorageUrl } from '@/lib/utils';
import { BadgeCheck } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Webinar {
    description?: string | null;
    benefits?: string | null;
    instructions?: string | null;
    tools?: { name: string; description?: string | null; icon: string | null }[];
}

export default function AboutSection({ webinar }: { webinar: Webinar }) {
    const { t } = useTranslation('user');
    const benefits = parseList(webinar.benefits);
    const instructions = parseList(webinar.instructions);

    const tabList = [
        { key: 'description', label: t('webinar.detail.tabDescription', 'Deskripsi') },
        { key: 'benefits', label: t('webinar.detail.tabBenefits', 'Manfaat') },
        ...(instructions.length > 0 ? [{ key: 'instructions', label: t('webinar.detail.tabInstructions', 'Instruksi') }] : []),
        ...(webinar.tools && webinar.tools.length > 0 ? [{ key: 'tools', label: t('webinar.detail.tabTools', 'Tools') }] : []),
    ];

    const [activeTab, setActiveTab] = useState('description');

    return (
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6" id="about">
            {/* Clean Tab Bar */}
            <div className="mb-6 overflow-x-auto border-b border-[#DCE3EC]">
                <div className="flex min-w-max items-center gap-6">
                    {tabList.map((tab) => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            className={`min-h-11 border-b-2 px-1 pb-2.5 text-sm font-semibold whitespace-nowrap transition-colors hover:cursor-pointer sm:text-base ${
                                activeTab === tab.key
                                    ? 'border-[#1976D3] text-[#1976D3]'
                                    : 'border-transparent text-[#5B6B7F] hover:text-[#12344E]'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'description' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('webinar.detail.descriptionTitle', 'Deskripsi Webinar')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('webinar.detail.descriptionSubtitle', 'Gambaran lengkap tentang webinar ini dan apa yang akan Anda pelajari.')}
                        </p>
                        <div className="prose prose-sm max-w-none text-[#162230] sm:prose-base">
                            <p className="leading-relaxed whitespace-pre-line text-[#475569]">
                                {webinar.description || t('webinar.detail.noDescription', 'Tidak ada deskripsi tersedia.')}
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'benefits' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('webinar.detail.benefitsTitle', 'Manfaat yang Akan Didapat')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('webinar.detail.benefitsSubtitle', 'Berbagai manfaat dan keuntungan yang akan Anda dapatkan setelah mengikuti webinar ini.')}
                        </p>
                        {benefits.length > 0 ? (
                            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {benefits.map((benefit, idx) => (
                                    <li
                                        key={idx}
                                        className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5"
                                    >
                                        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" />
                                        <p className="text-sm leading-relaxed text-[#162230]">{benefit}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <h3 className="text-base font-semibold text-[#12344E]">
                                        {t('webinar.detail.expertSpeaker', 'Pembicara Ahli')}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                                        {t(
                                            'webinar.detail.expertSpeakerDesc',
                                            'Belajar langsung dari para ahli dan praktisi berpengalaman di bidangnya untuk mendapatkan wawasan mendalam.',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <h3 className="text-base font-semibold text-[#12344E]">
                                        {t('webinar.detail.interactiveSession', 'Sesi Interaktif')}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                                        {t(
                                            'webinar.detail.interactiveSessionDesc',
                                            'Manfaatkan sesi tanya jawab langsung untuk berdiskusi, mengklarifikasi keraguan, dan memperluas pemahaman Anda.',
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <h3 className="text-base font-semibold text-[#12344E]">
                                        {t('webinar.detail.latestInsights', 'Wawasan Terkini')}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                                        {t(
                                            'webinar.detail.latestInsightsDesc',
                                            'Dapatkan pemahaman mendalam tentang tren dan teknologi terbaru yang relevan dengan perkembangan karir Anda.',
                                        )}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'instructions' && instructions.length > 0 && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('webinar.detail.instructionsTitle', 'Instruksi & Persiapan')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('webinar.detail.instructionsSubtitle', 'Panduan persiapan yang perlu Anda lakukan sebelum mengikuti webinar.')}
                        </p>
                        <ul className="space-y-3">
                            {instructions.map((instruction, idx) => (
                                <li
                                    key={idx}
                                    className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4"
                                >
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#12344E] text-xs font-semibold text-white">
                                        {idx + 1}
                                    </div>
                                    <p className="flex-1 text-sm leading-relaxed text-[#162230]">{instruction}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === 'tools' && webinar.tools && webinar.tools.length > 0 && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('webinar.detail.toolsTitle', 'Tools yang Digunakan')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('webinar.detail.toolsSubtitle', 'Berbagai alat/software yang akan digunakan atau dibahas dalam webinar ini.')}
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {webinar.tools.map((tool) => (
                                <div
                                    key={tool.name}
                                    className="flex flex-col items-center justify-center gap-2.5 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4 text-center"
                                >
                                    <img
                                        src={resolveStorageUrl(tool.icon) || '/assets/images/placeholder.png'}
                                        alt={tool.name}
                                        className="h-12 w-12 object-contain"
                                    />
                                    <h3 className="line-clamp-2 text-xs font-semibold text-[#162230] sm:text-sm">{tool.name}</h3>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
