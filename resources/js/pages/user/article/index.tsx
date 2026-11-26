import { ArticleCard } from '@/components/article-card';
import { Reveal } from '@/components/home-motion';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import UserLayout from '@/layouts/user-layout';
import { cn } from '@/lib/utils';
import { Head, Link, router } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface Category {
    id: string;
    name: string;
    articles_count: number;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    thumbnail?: string;
    category: {
        id: string;
        name: string;
    };
    user: {
        id: string;
        name: string;
    };
    read_time: number;
    views: number;
    published_at: string;
}

interface PopularArticle {
    id: string;
    title: string;
    slug: string;
    views: number;
    thumbnail?: string;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ArticleIndexProps {
    articles: {
        data: Article[];
        links: PaginationLink[];
        current_page: number;
        last_page: number;
    };
    categories: Category[];
    popularArticles: PopularArticle[];
    filters: {
        category?: string;
        sort?: string;
    };
}

const chipClass = (active: boolean) =>
    cn(
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm',
        'focus-visible:ring-2 focus-visible:ring-[#1976D3] focus-visible:ring-offset-2 focus-visible:outline-none',
        active
            ? 'border-[#12344E] bg-[#12344E] text-white'
            : 'border-[#DCE3EC] bg-white text-[#12344E] hover:border-[#1976D3] hover:bg-[#EAF3FC] hover:text-[#1976D3]',
    );

export default function ArticleIndex({ articles, categories, popularArticles, filters }: ArticleIndexProps) {
    const { t, i18n } = useTranslation(['user', 'common']);
    const numberLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const [selectedCategory, setSelectedCategory] = useState<string>(filters.category || '');
    const [sortBy, setSortBy] = useState<string>(filters.sort || 'latest');

    const visit = (category: string, sort: string) =>
        router.get('/article', { category: category || undefined, sort }, { preserveState: true, replace: true, preserveScroll: true });

    const handleFilter = (category: string) => {
        setSelectedCategory(category);
        visit(category, sortBy);
    };

    const handleSort = (sort: string) => {
        setSortBy(sort);
        visit(selectedCategory, sort);
    };

    return (
        <UserLayout>
            <Head title={t('article.headTitle')} />

            {/* Header */}
            <section className="w-full border-b border-[#E7E2D8] bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-8 sm:px-6 sm:pb-10 lg:px-8">
                    <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:mb-8 sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="text-[#162230]">{t('article.headTitle')}</span>
                    </nav>

                    <Reveal immediate y={20} delay={0.06} duration={0.6}>
                        <h1 className="font-literata text-[30px] leading-[1.15] font-bold tracking-tight text-[#12344E] sm:text-4xl lg:text-[44px]">
                            {t('article.title')}
                        </h1>
                    </Reveal>
                    <Reveal immediate y={16} delay={0.14} duration={0.6}>
                        <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-[#475569] sm:text-[17px]">{t('article.subtitle')}</p>
                    </Reveal>

                    {/* Filters */}
                    <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group">
                            <button type="button" className={chipClass(selectedCategory === '')} aria-pressed={selectedCategory === ''} onClick={() => handleFilter('')}>
                                {t('article.allCategories')}
                            </button>
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    className={chipClass(selectedCategory === cat.id)}
                                    aria-pressed={selectedCategory === cat.id}
                                    onClick={() => handleFilter(cat.id)}
                                >
                                    {cat.name}
                                    <span className={cn('text-[11px] tabular-nums', selectedCategory === cat.id ? 'text-white/70' : 'text-[#94A3B8]')}>
                                        {cat.articles_count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <span className="text-sm text-[#5B6B7F]">{t('article.sort')}</span>
                            <Select value={sortBy} onValueChange={handleSort}>
                                <SelectTrigger className="h-10 w-40 border-[#DCE3EC] bg-white">
                                    <SelectValue placeholder={t('article.sort')} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="latest">{t('article.sortLatest')}</SelectItem>
                                    <SelectItem value="popular">{t('article.sortPopular')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </section>

            <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_300px]">
                    {/* Main list */}
                    <div className="min-w-0">
                        <h2 className="mb-5 text-sm font-semibold tracking-wider text-[#5B6B7F] uppercase">{t('article.latestArticles')}</h2>

                        {articles.data.length > 0 ? (
                            <>
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    {articles.data.map((article, index) => (
                                        <Reveal key={article.id} y={24} delay={Math.min(index * 0.06, 0.36)} className="h-full">
                                            <ArticleCard article={article} />
                                        </Reveal>
                                    ))}
                                </div>

                                {articles.last_page > 1 && (
                                    <nav aria-label="Pagination" className="mt-10 flex flex-wrap justify-center gap-2">
                                        {articles.links.map((link, index) => (
                                            <Button
                                                key={index}
                                                variant={link.active ? 'default' : 'outline'}
                                                size="sm"
                                                className="min-w-9"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.visit(link.url)}
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        ))}
                                    </nav>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] px-6 py-16 text-center">
                                <p className="font-literata text-lg font-bold text-[#12344E]">{t('article.notFound')}</p>
                                <p className="text-sm text-[#475569]">{t('article.notFoundHint')}</p>
                                {selectedCategory && (
                                    <Button variant="outline" size="sm" className="mt-3" onClick={() => handleFilter('')}>
                                        {t('article.allCategories')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Popular sidebar */}
                    {popularArticles.length > 0 && (
                        <aside className="lg:sticky lg:top-24 lg:self-start">
                            <h2 className="mb-5 text-sm font-semibold tracking-wider text-[#5B6B7F] uppercase">{t('article.popularArticles')}</h2>
                            <ol className="divide-y divide-[#E7E2D8] rounded-xl border border-[#DCE3EC] bg-white">
                                {popularArticles.map((article, index) => (
                                    <li key={article.id}>
                                        <Link href={`/article/${article.slug}`} className="group flex gap-4 px-4 py-4 transition-colors hover:bg-[#FAF8F4]">
                                            <span className="font-literata w-6 shrink-0 text-2xl leading-none font-bold text-[#CBD5E1] tabular-nums group-hover:text-[#1976D3]">
                                                {index + 1}
                                            </span>
                                            <span className="min-w-0">
                                                <span className="line-clamp-2 text-sm leading-snug font-semibold text-[#162230] group-hover:text-[#1976D3]">
                                                    {article.title}
                                                </span>
                                                <span className="mt-1 block text-xs text-[#5B6B7F]">
                                                    {t('article.views', { count: article.views.toLocaleString(numberLocale) })}
                                                </span>
                                            </span>
                                        </Link>
                                    </li>
                                ))}
                            </ol>
                        </aside>
                    )}
                </div>
            </div>
        </UserLayout>
    );
}
