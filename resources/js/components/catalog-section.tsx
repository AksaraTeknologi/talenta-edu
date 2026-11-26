import { ProgramCard, type ProgramCardProduct } from '@/components/program-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

export interface CatalogItem {
    id: string;
    product: ProgramCardProduct;
    href: string;
    hasAccess?: boolean;
    mentorName?: string | null;
    tags?: string[];
}

interface CatalogCategory {
    id: string;
    name: string;
}

interface CatalogSectionProps {
    id: string;
    title: string;
    subtitle?: string;
    items: CatalogItem[];
    categories?: CatalogCategory[];
    searchPlaceholder: string;
    emptyText: string;
    emptySearchText?: string;
    allLabel: string;
    loadMoreLabel: string;
    pageSize?: number;
}

export function CatalogSection({
    id,
    title,
    subtitle,
    items,
    categories = [],
    searchPlaceholder,
    emptyText,
    emptySearchText,
    allLabel,
    loadMoreLabel,
    pageSize = 6,
}: CatalogSectionProps) {
    const { t } = useTranslation('home');
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [visibleCount, setVisibleCount] = useState(pageSize);

    const filtered = useMemo(() => {
        const query = search.trim().toLowerCase();
        return items.filter((item) => {
            const matchSearch = !query || item.product.title.toLowerCase().includes(query);
            const matchCategory = selectedCategory === null || item.product.category?.id === selectedCategory;
            return matchSearch && matchCategory;
        });
    }, [items, search, selectedCategory]);

    const visible = filtered.slice(0, visibleCount);
    const isFiltering = search.trim() !== '' || selectedCategory !== null;

    const selectCategory = (categoryId: string | null) => {
        setSelectedCategory(categoryId);
        setVisibleCount(pageSize);
    };

    const chipClass = (active: boolean) =>
        cn(
            'inline-flex min-h-9 shrink-0 items-center rounded-lg border px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors sm:text-sm',
            'focus-visible:ring-2 focus-visible:ring-[#1976D3] focus-visible:ring-offset-2 focus-visible:outline-none',
            active
                ? 'border-[#12344E] bg-[#12344E] text-white'
                : 'border-[#DCE3EC] bg-[#FAF8F4] text-[#12344E] hover:border-[#1976D3] hover:bg-[#EAF3FC] hover:text-[#1976D3]',
        );

    return (
        <section id={id} className="mx-auto w-full max-w-7xl scroll-mt-20 px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            {/* Header */}
            <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                    <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">{title}</h2>
                    {subtitle && <p className="mt-2 max-w-2xl text-sm text-[#475569] sm:text-base">{subtitle}</p>}
                </div>

                <div className="relative w-full lg:max-w-sm">
                    <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#5B6B7F]" aria-hidden="true" />
                    <Input
                        type="search"
                        placeholder={searchPlaceholder}
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setVisibleCount(pageSize);
                        }}
                        className="h-11 border-[#DCE3EC] bg-white pl-9"
                        aria-label={searchPlaceholder}
                    />
                </div>
            </div>

            {/* Category chips + result count */}
            <div className="mb-8 flex flex-col gap-3 border-b border-[#E7E2D8] pb-5 sm:flex-row sm:items-center sm:justify-between">
                {categories.length > 0 ? (
                    <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" role="group">
                        <button type="button" onClick={() => selectCategory(null)} className={chipClass(selectedCategory === null)} aria-pressed={selectedCategory === null}>
                            {allLabel}
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() => selectCategory(category.id)}
                                className={chipClass(selectedCategory === category.id)}
                                aria-pressed={selectedCategory === category.id}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div />
                )}
                <p className="shrink-0 text-xs font-medium text-[#5B6B7F] sm:text-sm" aria-live="polite">
                    {t('latest.resultCount', { count: filtered.length, defaultValue: `${filtered.length} program` })}
                </p>
            </div>

            {/* Grid */}
            {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] px-6 py-14 text-center">
                    <img src="/assets/images/not-found.webp" alt="" className="w-36" />
                    <p className="max-w-md text-sm text-[#475569]">{isFiltering && emptySearchText ? emptySearchText : emptyText}</p>
                    {isFiltering && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setSearch('');
                                selectCategory(null);
                            }}
                        >
                            {t('latest.resetFilter', 'Reset filter')}
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((item) => (
                        <ProgramCard
                            key={item.id}
                            product={item.product}
                            href={item.href}
                            hasAccess={item.hasAccess}
                            mentorName={item.mentorName}
                            tags={item.tags}
                        />
                    ))}
                </div>
            )}

            {visibleCount < filtered.length && (
                <div className="mt-10 flex justify-center">
                    <Button type="button" variant="outline" size="lg" className="h-11 px-8" onClick={() => setVisibleCount((prev) => prev + pageSize)}>
                        {loadMoreLabel}
                    </Button>
                </div>
            )}
        </section>
    );
}
