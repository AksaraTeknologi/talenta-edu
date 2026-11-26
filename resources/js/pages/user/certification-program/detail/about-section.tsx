import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface CertificationProgram {
    description?: string | null;
    benefits?: string | null;
    terms_conditions?: string | null;
    scholarship_flow?: string | null;
    type: 'regular' | 'scholarship';
}

export default function AboutSection({ program }: { program: CertificationProgram }) {
    const { t } = useTranslation('user');

    const tabs = [
        { key: 'description', label: t('certificationProgram.detail.about.badgeAbout', 'Tentang Program') },
        { key: 'benefits', label: t('certificationProgram.detail.tabs.benefits', 'Manfaat') },
        { key: 'terms_conditions', label: t('certificationProgram.detail.about.badgeTerms', 'Syarat & Ketentuan') },
    ];

    if (program.type === 'scholarship') {
        tabs.push({ key: 'scholarship_flow', label: t('certificationProgram.detail.about.badgeScholarshipFlow', 'Alur Beasiswa') });
    }

    const [activeTab, setActiveTab] = useState(tabs[0].key);

    return (
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6" id="about">
            <div className="mb-6 overflow-x-auto border-b border-[#DCE3EC]">
                <div className="flex min-w-max items-center gap-6">
                    {tabs.map((tab) => (
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
                            {t('certificationProgram.detail.about.badgeAbout', 'Tentang Program')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('certificationProgram.detail.about.aboutDesc', 'Gambaran lengkap tentang program ini dan apa yang akan Anda pelajari.')}
                        </p>
                        <div className="prose prose-sm max-w-none text-[#475569] sm:prose-base">
                            <div
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: program.description || t('certificationProgram.detail.about.noDesc', 'Tidak ada deskripsi tersedia.'),
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'benefits' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('certificationProgram.detail.about.badgeBenefits', 'Manfaat Program')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t(
                                'certificationProgram.detail.about.benefitsDesc',
                                'Berbagai manfaat dan keuntungan yang akan Anda dapatkan setelah mengikuti program ini.',
                            )}
                        </p>
                        <div className="prose prose-sm max-w-none text-[#475569] sm:prose-base">
                            <div
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html: program.benefits || t('certificationProgram.detail.about.noBenefits', 'Tidak ada manfaat tersedia.'),
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'terms_conditions' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('certificationProgram.detail.about.badgeTerms', 'Syarat & Ketentuan')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('certificationProgram.detail.about.termsDesc', 'Persyaratan yang perlu Anda penuhi sebelum mengikuti program ini.')}
                        </p>
                        <div className="prose prose-sm max-w-none text-[#475569] sm:prose-base">
                            <div
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html:
                                        program.terms_conditions ||
                                        t('certificationProgram.detail.about.noTerms', 'Tidak ada syarat dan ketentuan khusus.'),
                                }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'scholarship_flow' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('certificationProgram.detail.about.badgeScholarshipFlow', 'Alur Beasiswa')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('certificationProgram.detail.about.scholarshipFlowDesc', 'Tahapan alur proses pendaftaran beasiswa untuk program ini.')}
                        </p>
                        <div className="prose prose-sm max-w-none text-[#475569] sm:prose-base">
                            <div
                                className="leading-relaxed"
                                dangerouslySetInnerHTML={{
                                    __html:
                                        program.scholarship_flow ||
                                        t('certificationProgram.detail.about.noScholarshipFlow', 'Tidak ada informasi alur beasiswa.'),
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
