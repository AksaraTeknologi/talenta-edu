import { ProgramBadge, type ProgramType } from '@/components/program-badge';
import { calculateDiscountPercent, formatIndonesianDate, resolveStorageUrl } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { Calendar, Clock, InfinityIcon, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ProgramCardProduct {
    id: string;
    title: string;
    thumbnail?: string | null;
    slug: string;
    strikethrough_price?: number;
    price: number;
    level?: 'beginner' | 'intermediate' | 'advanced';
    start_date?: string;
    end_date?: string;
    start_time?: string;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
    program_type?: 'regular' | 'scholarship';
    category?: { id?: string; name: string } | null;
    type: ProgramType;
}

interface ProgramCardProps {
    product: ProgramCardProduct;
    href: string;
    hasAccess?: boolean;
    /** Mentor / speaker line shown under the schedule. */
    mentorName?: string | null;
    /** Extra neutral tags next to the type badge, e.g. "Beasiswa" or "3 Program". */
    tags?: string[];
}

const DAY_MS = 1000 * 60 * 60 * 24;

export function ProgramCard({ product, href, hasAccess = false, mentorName, tags = [] }: ProgramCardProps) {
    const { t, i18n } = useTranslation(['home', 'user']);
    const lang = i18n.language || 'id';

    const imageSrc = resolveStorageUrl(product.thumbnail) || '/assets/images/placeholder.png';
    const discountPercent = calculateDiscountPercent(product.strikethrough_price, product.price);

    const certDeadline =
        product.type === 'certification-program'
            ? product.program_type === 'scholarship'
                ? product.socialization_registration_deadline
                : product.registration_deadline
            : undefined;

    let scheduleMeta: string | null = null;
    let ScheduleIcon = Calendar;
    let scheduleTone: 'default' | 'urgent' | 'closed' = 'default';

    if (product.type === 'bootcamp' && product.start_date) {
        const startText = formatIndonesianDate(product.start_date, lang);
        const endText = product.end_date ? formatIndonesianDate(product.end_date, lang) : '';
        scheduleMeta = endText && endText !== startText ? `${startText} – ${endText}` : startText;
    } else if (product.type === 'webinar' && product.start_time) {
        scheduleMeta = formatIndonesianDate(product.start_time, lang);
    } else if (product.type === 'course') {
        scheduleMeta = t('home:latest.lifetimeAccess', 'Akses Selamanya');
        ScheduleIcon = InfinityIcon;
    } else {
        const deadline = product.type === 'bundle' ? product.registration_deadline : certDeadline;
        if (deadline) {
            ScheduleIcon = Clock;
            const daysLeft = Math.ceil((new Date(deadline).getTime() - Date.now()) / DAY_MS);

            if (daysLeft <= 0) {
                scheduleTone = 'closed';
                scheduleMeta = t('home:latest.registrationClosed', 'Pendaftaran ditutup');
            } else if (daysLeft <= 3) {
                scheduleTone = 'urgent';
                scheduleMeta = t('home:latest.closingSoon', {
                    count: daysLeft,
                    defaultValue: `Pendaftaran tutup ${daysLeft} hari lagi`,
                });
            } else {
                scheduleMeta = t('home:latest.registerUntil', {
                    date: formatIndonesianDate(deadline, lang),
                    defaultValue: `Daftar s/d ${formatIndonesianDate(deadline, lang)}`,
                });
            }
        }
    }

    const scheduleToneClass = {
        default: 'text-[#475569]',
        urgent: 'text-[#B8470A]',
        closed: 'text-[#94A3B8]',
    }[scheduleTone];

    return (
        <Link
            href={href}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#93C5FD] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1976D3] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
            {/* Clean media frame without overlay chips */}
            <div className="aspect-[16/10] w-full overflow-hidden border-b border-[#EEF2F6] bg-[#F2F6FA]">
                <img src={imageSrc} alt={product.title} className="h-full w-full object-contain p-2 transition-transform duration-200 group-hover:scale-[1.02]" loading="lazy" />
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
                {/* Type badge + neutral category label */}
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <ProgramBadge type={product.type} />
                        {tags.map((tag) => (
                            <span
                                key={tag}
                                className="rounded-md border border-[#DCE3EC] bg-white px-2 py-0.5 text-[11px] font-medium text-[#475569]"
                            >
                                {tag}
                            </span>
                        ))}
                    </div>
                    {product.category?.name && <span className="text-xs font-medium text-[#5B6B7F]">{product.category.name}</span>}
                </div>

                {/* Title */}
                <h3 className="mb-3 line-clamp-2 text-base font-semibold leading-snug text-[#162230] transition-colors group-hover:text-[#1976D3]">
                    {product.title}
                </h3>

                {/* Schedule / batch differentiator */}
                {(scheduleMeta || mentorName) && (
                    <div className="mb-4 flex flex-col gap-1.5">
                        {scheduleMeta && (
                            <div className={`flex items-center gap-2 text-xs font-medium ${scheduleToneClass}`}>
                                <ScheduleIcon className="h-4 w-4 shrink-0 opacity-80" />
                                <span className="line-clamp-1">{scheduleMeta}</span>
                            </div>
                        )}
                        {mentorName && (
                            <div className="flex items-center gap-2 text-xs text-[#5B6B7F]">
                                <UserRound className="h-4 w-4 shrink-0 opacity-80" />
                                <span className="line-clamp-1">{mentorName}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Price row */}
                <div className="mt-auto border-t border-[#F1F5F9] pt-3">
                    {hasAccess ? (
                        <span className="inline-flex items-center text-sm font-semibold text-[#15803D]">
                            {t('user:course.catalog.owned', 'Sudah Akses')}
                        </span>
                    ) : product.price === 0 ? (
                        <span className="text-lg font-bold text-[#15803D]">{t('home:latest.free', 'Gratis')}</span>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {discountPercent > 0 && product.strikethrough_price && (
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-[#64748B] line-through tabular-nums">
                                        Rp {product.strikethrough_price.toLocaleString('id-ID')}
                                    </span>
                                    <span className="rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-2 py-0.5 text-[11px] font-semibold text-[#B8470A]">
                                        {t('home:latest.save', { discount: discountPercent, defaultValue: `Hemat ${discountPercent}%` })}
                                    </span>
                                </div>
                            )}
                            <p className="text-lg font-bold text-[#12344E] tabular-nums">
                                Rp {product.price.toLocaleString('id-ID')}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
