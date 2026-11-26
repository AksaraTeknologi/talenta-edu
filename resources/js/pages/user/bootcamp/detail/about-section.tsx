import { parseList, resolveStorageUrl } from '@/lib/utils';
import { BadgeCheck, BookOpen } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Bootcamp {
    description?: string | null;
    curriculum?: string | null;
    benefits?: string | null;
    requirements?: string | null;
    tools?: { name: string; description?: string | null; icon: string | null }[];
}

export default function AboutSection({ bootcamp }: { bootcamp: Bootcamp }) {
    const { t } = useTranslation('user');
    const [activeTab, setActiveTab] = useState('description');
    const curriculumItems = parseList(bootcamp.curriculum);
    const benefits = parseList(bootcamp.benefits);
    const requirements = parseList(bootcamp.requirements);

    const tabList = [
        { key: 'description', label: t('bootcamp.register.tabDetail', 'Deskripsi') },
        ...(curriculumItems.length > 0 || bootcamp.curriculum
            ? [{ key: 'curriculum', label: t('bootcamp.detail.tabCurriculum', 'Kurikulum') }]
            : []),
        { key: 'benefits', label: t('bootcamp.detail.benefitsGained', 'Manfaat') },
        ...(requirements.length > 0 ? [{ key: 'requirements', label: t('bootcamp.detail.tabRequirements', 'Persyaratan') }] : []),
        ...(bootcamp.tools && bootcamp.tools.length > 0 ? [{ key: 'tools', label: t('bootcamp.detail.tabTools', 'Tools') }] : []),
    ];

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

            <div>
                {activeTab === 'description' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('bootcamp.detail.navAbout', 'Deskripsi Bootcamp')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('bootcamp.detail.heroDefaultDesc', 'Gambaran lengkap tentang bootcamp ini dan apa yang akan Anda pelajari.')}
                        </p>
                        <p className="text-sm leading-relaxed whitespace-pre-line text-[#475569] sm:text-base">
                            {bootcamp.description || t('bootcamp.detail.curriculumEmpty', 'Tidak ada deskripsi tersedia.')}
                        </p>
                    </div>
                )}

                {activeTab === 'curriculum' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('bootcamp.detail.curriculumTitle', 'Materi yang Akan Dipelajari')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('bootcamp.detail.curriculumSubtitle', 'Kurikulum terstruktur dari dasar hingga praktik langsung.')}
                        </p>
                        {curriculumItems.length > 0 ? (
                            <ul className="space-y-3">
                                {curriculumItems.map((item, idx) => (
                                    <li key={idx} className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#12344E] text-xs font-semibold text-white">
                                            {idx + 1}
                                        </div>
                                        <p className="flex-1 text-sm leading-relaxed text-[#162230]">{item}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div
                                className="prose prose-sm max-w-none text-[#475569]"
                                dangerouslySetInnerHTML={{ __html: bootcamp.curriculum || '' }}
                            />
                        )}
                    </div>
                )}

                {activeTab === 'benefits' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('bootcamp.detail.benefitsGained', 'Manfaat yang Akan Didapat')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('bootcamp.register.whatYouWillGetDesc', 'Berbagai manfaat dan keuntungan yang akan Anda dapatkan setelah mengikuti bootcamp ini.')}
                        </p>
                        {benefits.length > 0 ? (
                            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" />
                                        <p className="text-sm leading-relaxed text-[#162230]">{benefit}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <BookOpen className="mb-2 h-5 w-5 text-[#1976D3]" />
                                    <h3 className="text-base font-semibold text-[#12344E]">
                                        {t('bootcamp.detail.curriculumModern', 'Kurikulum Terstruktur')}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                                        {t('bootcamp.detail.curriculumModernDesc', 'Dirancang sesuai kebutuhan praktik akuntansi dan perpajakan terkini.')}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <BadgeCheck className="mb-2 h-5 w-5 text-[#15803D]" />
                                    <h3 className="text-base font-semibold text-[#12344E]">
                                        {t('bootcamp.detail.careerReady', 'Siap Kerja')}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                                        {t('bootcamp.detail.careerReadyDesc', 'Dilengkapi studi kasus nyata untuk bekal langsung di dunia kerja.')}
                                    </p>
                                </div>
                                <div className="rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4">
                                    <BadgeCheck className="mb-2 h-5 w-5 text-[#1976D3]" />
                                    <h3 className="text-base font-semibold text-[#12344E]">
                                        {t('bootcamp.detail.fullSupport', 'Dukungan Mentor')}
                                    </h3>
                                    <p className="mt-1 text-xs leading-relaxed text-[#475569] sm:text-sm">
                                        {t('bootcamp.detail.fullSupportDesc', 'Bimbingan langsung dari mentor praktisi selama program berlangsung.')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'requirements' && requirements.length > 0 && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('bootcamp.detail.participantRequirements', 'Persyaratan & Persiapan')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('bootcamp.register.participantRequirementsDesc', 'Persyaratan yang perlu Anda penuhi sebelum mengikuti bootcamp ini.')}
                        </p>
                        <ul className="space-y-3">
                            {requirements.map((requirement, idx) => (
                                <li key={idx} className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#F2F6FA] p-4">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#12344E] text-xs font-semibold text-white">
                                        {idx + 1}
                                    </div>
                                    <p className="flex-1 text-sm leading-relaxed text-[#162230]">{requirement}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {activeTab === 'tools' && bootcamp.tools && bootcamp.tools.length > 0 && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('bootcamp.detail.toolsUsed', 'Tools yang Digunakan')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('bootcamp.detail.toolsSubtitle', 'Berbagai alat/software yang akan digunakan atau dipelajari dalam bootcamp ini.')}
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {bootcamp.tools.map((tool) => (
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
