import { resolveStorageUrl } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { Clock, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface ArticleCardData {
    id: string;
    title: string;
    slug: string;
    excerpt?: string | null;
    thumbnail?: string | null;
    category?: { name: string } | null;
    user?: { name: string } | null;
    read_time: number;
    views: number;
    published_at: string;
}

export function ArticleCard({ article }: { article: ArticleCardData }) {
    const { t, i18n } = useTranslation('user');
    const dateLocale = i18n.language === 'en' ? enUS : id;
    const numberLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';

    return (
        <Link
            href={`/article/${article.slug}`}
            className="group flex h-full flex-col overflow-hidden rounded-xl border border-[#DCE3EC] bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-[#93C5FD] hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#1976D3] focus-visible:ring-offset-2 focus-visible:outline-none"
        >
            <div className="aspect-[16/9] w-full overflow-hidden border-b border-[#EEF2F6] bg-[#F2F6FA]">
                <img
                    src={resolveStorageUrl(article.thumbnail) || '/assets/images/placeholder.png'}
                    alt={article.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
            </div>

            <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {article.category?.name && <span className="font-semibold tracking-wide text-[#1976D3] uppercase">{article.category.name}</span>}
                    {article.category?.name && article.user?.name && <span className="text-[#CBD5E1]">•</span>}
                    {article.user?.name && <span className="font-medium text-[#5B6B7F]">{article.user.name}</span>}
                </div>

                <h3 className="font-literata line-clamp-2 text-lg leading-snug font-bold text-[#12344E] transition-colors group-hover:text-[#1976D3]">
                    {article.title}
                </h3>

                {article.excerpt && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#475569]">{article.excerpt}</p>}

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#F1F5F9] pt-3 text-xs text-[#5B6B7F]">
                    <span>{format(new Date(article.published_at), 'dd MMM yyyy', { locale: dateLocale })}</span>
                    <span className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {t('article.min', { count: article.read_time })}
                        </span>
                        <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5" />
                            {article.views.toLocaleString(numberLocale)}
                        </span>
                    </span>
                </div>
            </div>
        </Link>
    );
}
