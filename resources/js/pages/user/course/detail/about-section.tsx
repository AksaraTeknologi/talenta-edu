import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { parseList, resolveStorageUrl } from '@/lib/utils';
import { BadgeCheck, ChevronDown, Lock, PlayCircle } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Course {
    title: string;
    description?: string | null;
    key_points?: string | null;
    user?: { id: string; name: string; bio: string | null };
    images?: { image_url: string }[];
    modules?: {
        title: string;
        description?: string | null;
        lessons?: {
            title: string;
            description?: string | null;
            type: 'text' | 'video' | 'file' | 'quiz';
            is_free?: boolean;
        }[];
    }[];
    tools?: { name: string; description?: string | null; icon: string | null }[];
}

export default function AboutSection({ course }: { course: Course }) {
    const { t } = useTranslation('user');
    const keyPoints = parseList(course.key_points);
    const [expanded, setExpanded] = useState<React.Key | null>('0');

    const hasHighlights = Boolean(course.images && course.images.length > 0);
    const hasTools = Boolean(course.tools && course.tools.length > 0);

    const tabList = [
        { key: 'points', label: t('course.detail.tabPoints', 'Poin Utama') },
        { key: 'modules', label: t('course.detail.tabModules', 'Modul') },
        ...(hasHighlights ? [{ key: 'highlight', label: t('course.detail.tabHighlight', 'Highlight') }] : []),
        ...(hasTools ? [{ key: 'tools', label: t('course.detail.tabTools', 'Tools') }] : []),
    ];

    const [activeTab, setActiveTab] = useState('points');

    return (
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6" id="about">
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
                {activeTab === 'points' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('course.detail.pointsTitle', 'Poin Utama')}
                        </h2>
                        {course.description && (
                            <p className="mt-2 mb-5 text-sm leading-relaxed whitespace-pre-line text-[#475569] sm:text-base">
                                {course.description}
                            </p>
                        )}
                        {keyPoints.length > 0 && (
                            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                {keyPoints.map((req, idx) => (
                                    <li key={idx} className="flex items-start gap-3 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-3.5">
                                        <BadgeCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#15803D]" />
                                        <p className="text-sm leading-relaxed text-[#162230]">{req}</p>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}

                {activeTab === 'modules' && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('course.detail.modulesTitle', 'Modul Pembelajaran')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('course.detail.modulesDesc', 'Daftar modul dan materi yang akan Anda pelajari dalam kelas ini.')}
                        </p>
                        {course.modules && course.modules.length > 0 ? (
                            <Accordion
                                className="flex w-full flex-col gap-3"
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                                expandedValue={expanded}
                                onValueChange={setExpanded}
                            >
                                {course.modules.map((module, idx) => (
                                    <AccordionItem key={idx} value={String(idx)} className="overflow-hidden rounded-xl border border-[#DCE3EC] bg-white">
                                        <AccordionTrigger className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-[#FAF8F4]">
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#12344E] text-xs font-semibold text-white">
                                                    {idx + 1}
                                                </span>
                                                <span className="truncate text-sm font-semibold text-[#162230] sm:text-base">{module.title}</span>
                                            </div>
                                            <ChevronDown
                                                className={`h-4 w-4 shrink-0 text-[#1976D3] transition-transform duration-200 ${
                                                    expanded === String(idx) ? 'rotate-180' : ''
                                                }`}
                                            />
                                        </AccordionTrigger>
                                        <AccordionContent className="border-t border-[#DCE3EC] bg-[#FAF8F4] px-4 py-3">
                                            <ul className="space-y-2 text-sm text-[#475569]">
                                                {module.lessons && module.lessons.length > 0 ? (
                                                    module.lessons.map((lesson, lidx) => (
                                                        <li key={lidx} className="flex items-start gap-2.5 py-1">
                                                            {lesson.is_free ? (
                                                                <PlayCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#15803D]" />
                                                            ) : (
                                                                <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#5B6B7F]" />
                                                            )}
                                                            <span className="flex-1">{lesson.title}</span>
                                                        </li>
                                                    ))
                                                ) : (
                                                    <li className="text-xs text-[#5B6B7F]">{t('course.detail.noLessons', 'Belum ada materi')}</li>
                                                )}
                                            </ul>
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        ) : (
                            <p className="text-sm text-[#5B6B7F]">{t('course.detail.noModules', 'Belum ada modul.')}</p>
                        )}
                    </div>
                )}

                {activeTab === 'highlight' && hasHighlights && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('course.detail.highlightTitle', 'Highlight Kelas')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('course.detail.highlightDesc', 'Cuplikan materi yang akan memberikan gambaran singkat tentang isi kelas.')}
                        </p>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {course.images?.map((image, index) => (
                                <img
                                    key={index}
                                    src={resolveStorageUrl(image.image_url) || '/assets/images/placeholder.png'}
                                    alt={course.title}
                                    className="aspect-video w-full rounded-xl border border-[#DCE3EC] object-cover"
                                />
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'tools' && hasTools && (
                    <div>
                        <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                            {t('course.detail.toolsTitle', 'Tools yang Digunakan')}
                        </h2>
                        <p className="mt-1.5 mb-5 text-sm text-[#5B6B7F]">
                            {t('course.detail.toolsDesc', 'Berbagai alat dan software yang digunakan dalam kelas ini.')}
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                            {course.tools?.map((tool) => (
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
