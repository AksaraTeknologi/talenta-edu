import { Reveal } from '@/components/home-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useInitials } from '@/hooks/use-initials';
import UserLayout from '@/layouts/user-layout';
import { resolveStorageUrl } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { enUS, id } from 'date-fns/locale';
import { ArrowRight, ChevronRight, Clock, Eye, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

interface Category {
    id: string;
    name: string;
}

interface Author {
    id: string;
    name: string;
    bio: string;
    avatar?: string;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content?: string;
    thumbnail?: string;
    category: Category;
    user: Author;
    read_time: number;
    views: number;
    published_at: string;
    created_at: string;
}

interface RelatedArticle {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    thumbnail?: string;
    read_time: number;
    published_at: string;
}

interface ArticleShowProps {
    article: Article;
    relatedArticles: RelatedArticle[];
}

export default function ArticleShow({ article, relatedArticles }: ArticleShowProps) {
    const { t, i18n } = useTranslation(['user', 'common']);
    const dateFnsLocale = i18n.language === 'en' ? enUS : id;
    const numberLocale = i18n.language === 'en' ? 'en-US' : 'id-ID';
    const getInitials = useInitials();
    const authorName = article.user.name === 'Admin' ? t('article.team') : article.user.name;
    const thumbnail = resolveStorageUrl(article.thumbnail);

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({ title: article.title, text: article.excerpt || article.title, url: window.location.href });
            } catch {
                // user cancelled the share sheet
            }
            return;
        }
        await navigator.clipboard.writeText(window.location.href);
        toast.success(t('article.linkCopied'));
    };

    return (
        <UserLayout>
            <Head title={article.title} />

            {/* Header */}
            <header className="w-full border-b border-[#E7E2D8] bg-[#FAF8F4]">
                <div className="mx-auto max-w-5xl px-4 pt-6 pb-8 sm:px-6 sm:pb-10 lg:px-8">
                    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:mb-8 sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link href="/article" className="hover:text-[#1976D3]">
                            {t('article.headTitle')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1 text-[#162230]">{article.title}</span>
                    </nav>

                    <Reveal immediate y={14} delay={0.04} duration={0.5}>
                        <Link
                            href={`/article?category=${article.category.id}`}
                            className="text-xs font-semibold tracking-wider text-[#1976D3] uppercase hover:underline sm:text-sm"
                        >
                            {article.category.name}
                        </Link>
                    </Reveal>

                    <Reveal immediate y={20} delay={0.1} duration={0.6}>
                        <h1 className="font-literata mt-3 max-w-4xl text-[28px] leading-[1.2] font-bold tracking-tight text-[#12344E] sm:text-4xl lg:text-[44px]">
                            {article.title}
                        </h1>
                    </Reveal>

                    {article.excerpt && (
                        <Reveal immediate y={16} delay={0.16} duration={0.6}>
                            <p className="mt-4 max-w-3xl text-base leading-relaxed text-[#475569] sm:text-lg">{article.excerpt}</p>
                        </Reveal>
                    )}

                    <Reveal immediate y={14} delay={0.22} duration={0.55}>
                        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#5B6B7F]">
                                <span className="flex items-center gap-2 font-medium text-[#162230]">
                                    <Avatar className="h-8 w-8 border border-[#DCE3EC]">
                                        <AvatarImage src={article.user.avatar} alt={authorName} />
                                        <AvatarFallback className="bg-[#EAF3FC] text-xs font-semibold text-[#12344E]">
                                            {getInitials(article.user.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {authorName}
                                </span>
                                <span>{format(new Date(article.published_at), 'dd MMMM yyyy', { locale: dateFnsLocale })}</span>
                                <span className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    {t('article.minRead', { count: article.read_time })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    {t('article.views', { count: article.views.toLocaleString(numberLocale) })}
                                </span>
                            </div>
                            <Button variant="outline" onClick={handleShare} className="shrink-0 self-start sm:self-auto">
                                <Share2 className="h-4 w-4" />
                                {t('article.shareArticle')}
                            </Button>
                        </div>
                    </Reveal>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                {thumbnail && (
                    <div className="mb-10 aspect-[16/9] w-full overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#F2F6FA]">
                        <img src={thumbnail} alt={article.title} className="h-full w-full object-cover" />
                    </div>
                )}

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_280px]">
                    {/* Body */}
                    <article className="min-w-0">
                        <div className="prose prose-lg prose-slate prose-headings:font-literata prose-headings:text-[#12344E] prose-a:text-[#1976D3] prose-img:rounded-xl max-w-none">
                            {article.content ? <div dangerouslySetInnerHTML={{ __html: article.content }} /> : <p className="text-[#5B6B7F]">{t('article.noContent')}</p>}
                        </div>

                        {/* Author */}
                        <div className="mt-12 flex items-start gap-4 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-5 sm:p-6">
                            <Avatar className="h-14 w-14 shrink-0 border border-[#DCE3EC]">
                                <AvatarImage src={article.user.avatar} alt={authorName} />
                                <AvatarFallback className="bg-[#EAF3FC] text-lg font-semibold text-[#12344E]">{getInitials(article.user.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="text-xs font-semibold tracking-wider text-[#5B6B7F] uppercase">{t('article.aboutAuthor')}</p>
                                <p className="mt-1 text-base font-semibold text-[#162230]">{authorName}</p>
                                {article.user.bio && <p className="mt-1 text-sm leading-relaxed text-[#475569]">{article.user.bio}</p>}
                            </div>
                        </div>
                    </article>

                    {/* Sidebar */}
                    <aside className="flex flex-col gap-8 lg:sticky lg:top-24 lg:self-start">
                        {relatedArticles.length > 0 && (
                            <div>
                                <h2 className="mb-4 text-sm font-semibold tracking-wider text-[#5B6B7F] uppercase">{t('article.relatedArticles')}</h2>
                                <ul className="space-y-4">
                                    {relatedArticles.map((related) => (
                                        <li key={related.id}>
                                            <Link href={`/article/${related.slug}`} className="group flex gap-3">
                                                <img
                                                    src={resolveStorageUrl(related.thumbnail) || '/assets/images/placeholder.png'}
                                                    alt=""
                                                    loading="lazy"
                                                    className="h-16 w-20 shrink-0 rounded-lg border border-[#EEF2F6] object-cover"
                                                />
                                                <span className="min-w-0">
                                                    <span className="line-clamp-2 text-sm leading-snug font-semibold text-[#162230] group-hover:text-[#1976D3]">
                                                        {related.title}
                                                    </span>
                                                    <span className="mt-1 block text-xs text-[#5B6B7F]">
                                                        {format(new Date(related.published_at), 'dd MMM yyyy', { locale: dateFnsLocale })} ·{' '}
                                                        {t('article.min', { count: related.read_time })}
                                                    </span>
                                                </span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* CTA */}
                        <div className="rounded-xl bg-[#12344E] p-6 text-white">
                            <h2 className="font-literata text-lg font-bold">{t('article.wantToLearnMore')}</h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-300">{t('article.ctaDesc')}</p>
                            <div className="mt-5 flex flex-col gap-2">
                                <Link
                                    href="/bootcamp"
                                    className="group inline-flex items-center justify-between rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#12344E] transition-colors hover:bg-[#EAF3FC]"
                                >
                                    {t('article.viewBootcamps')}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                                <Link
                                    href="/course"
                                    className="group inline-flex items-center justify-between rounded-lg border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                                >
                                    {t('article.viewCourses')}
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </UserLayout>
    );
}
