import { ArticleCard } from '@/components/article-card';
import { Reveal } from '@/components/home-motion';
import { ProgramCard } from '@/components/program-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInitials } from '@/hooks/use-initials';
import UserLayout from '@/layouts/user-layout';
import { Head, Link } from '@inertiajs/react';
import { ChevronRight, Mail, Phone } from 'lucide-react';
import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

interface Category {
    id: string;
    name: string;
}

interface Course {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    category: Category;
    price: number;
    discount_price?: number;
    level: string;
    students_count: number;
    rating: number;
}

interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    thumbnail?: string;
    category: Category;
    read_time: number;
    views: number;
    published_at: string;
}

interface Webinar {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    category: Category;
    price: number;
    strikethrough_price: number;
    start_time: string;
    end_time: string;
    batch?: number;
    registration_deadline: string;
    is_registration_closed: boolean;
}

interface Bootcamp {
    id: string;
    title: string;
    slug: string;
    thumbnail?: string;
    category: Category;
    price: number;
    strikethrough_price: number;
    start_date: string;
    end_date: string;
    batch?: number;
    registration_deadline: string;
    is_registration_closed: boolean;
    duration_weeks: number;
}

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
    email: string;
    phone_number?: string;
}

interface Stats {
    total_courses: number;
    total_articles: number;
    total_webinars: number;
    total_bootcamps: number;
}

interface MentorShowProps {
    mentor: Mentor;
    courses: Course[];
    articles: Article[];
    webinars: Webinar[];
    bootcamps: Bootcamp[];
    stats: Stats;
}

function EmptyTab({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] px-6 py-14 text-center">
            <p className="font-literata text-lg font-bold text-[#12344E]">{title}</p>
            <p className="max-w-md text-sm text-[#475569]">{description}</p>
        </div>
    );
}

function CardGrid({ children }: { children: ReactNode }) {
    return <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

export default function MentorShow({ mentor, courses, articles, bootcamps, stats }: MentorShowProps) {
    const { t } = useTranslation(['user', 'common']);
    const getInitials = useInitials();

    const levelLabels: Record<string, string> = {
        beginner: t('mentor.levels.beginner'),
        intermediate: t('mentor.levels.intermediate'),
        advanced: t('mentor.levels.advanced'),
    };

    const statItems = [
        { value: stats.total_courses, label: t('mentor.onlineCourse') },
        { value: stats.total_bootcamps, label: t('mentor.stats.bootcamps') },
        { value: stats.total_articles, label: t('mentor.stats.articles') },
    ];

    const tabTriggerClass =
        '-mb-px h-auto flex-none rounded-none border-0 border-b-2 border-b-transparent px-1 pt-0 pb-3 text-sm font-semibold text-[#5B6B7F] shadow-none hover:text-[#12344E] data-[state=active]:border-b-[#12344E] data-[state=active]:bg-transparent data-[state=active]:text-[#12344E] data-[state=active]:shadow-none';

    return (
        <UserLayout>
            <Head title={`Mentor - ${mentor.name}`} />

            {/* Profile header */}
            <section className="w-full border-b border-[#E7E2D8] bg-[#FAF8F4]">
                <div className="mx-auto max-w-7xl px-4 pt-6 pb-10 sm:px-6 sm:pb-12 lg:px-8">
                    <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs font-medium text-[#5B6B7F] sm:mb-8 sm:text-sm">
                        <Link href="/" className="hover:text-[#1976D3]">
                            {t('common:nav.home', 'Beranda')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <Link href="/mentor" className="hover:text-[#1976D3]">
                            {t('mentor.headTitle')}
                        </Link>
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1 text-[#162230]">{mentor.name}</span>
                    </nav>

                    <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
                        <Reveal immediate y={20} delay={0.06} duration={0.6} className="lg:col-span-8">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                                <Avatar className="h-24 w-24 shrink-0 border border-[#DCE3EC] bg-white sm:h-28 sm:w-28">
                                    <AvatarImage src={mentor.avatar} alt={mentor.name} className="object-cover" />
                                    <AvatarFallback className="bg-[#EAF3FC] text-3xl font-semibold text-[#12344E]">{getInitials(mentor.name)}</AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#FED7AA] bg-[#FFF3EB] px-3 py-0.5 text-xs font-semibold text-[#B8470A]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#D95B16]" aria-hidden="true" />
                                        {t('mentor.proBadge')}
                                    </div>
                                    <h1 className="font-literata text-[28px] leading-[1.15] font-bold tracking-tight text-[#12344E] sm:text-4xl">{mentor.name}</h1>
                                    <p className="mt-3 max-w-2xl text-[15px] leading-[1.65] text-[#475569] sm:text-base">{mentor.bio || t('mentor.defaultBio')}</p>

                                    {(mentor.email || mentor.phone_number) && (
                                        <div className="mt-5 flex flex-wrap gap-2">
                                            {mentor.email && (
                                                <a
                                                    href={`mailto:${mentor.email}`}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 py-1.5 text-sm text-[#162230] transition-colors hover:border-[#1976D3] hover:text-[#1976D3]"
                                                >
                                                    <Mail className="h-4 w-4 text-[#5B6B7F]" />
                                                    {mentor.email}
                                                </a>
                                            )}
                                            {mentor.phone_number && (
                                                <a
                                                    href={`tel:${mentor.phone_number}`}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-[#DCE3EC] bg-white px-3 py-1.5 text-sm text-[#162230] transition-colors hover:border-[#1976D3] hover:text-[#1976D3]"
                                                >
                                                    <Phone className="h-4 w-4 text-[#5B6B7F]" />
                                                    {mentor.phone_number}
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Reveal>

                        <Reveal immediate y={20} delay={0.16} duration={0.6} className="lg:col-span-4">
                            <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-[#DCE3EC] bg-[#DCE3EC] shadow-xs">
                                {statItems.map((s) => (
                                    <div key={s.label} className="flex flex-col-reverse bg-white px-4 py-4 text-center">
                                        <dt className="mt-1 text-xs font-medium text-[#5B6B7F]">{s.label}</dt>
                                        <dd className="font-literata text-2xl font-bold text-[#12344E] tabular-nums sm:text-3xl">{s.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </Reveal>
                    </div>
                </div>
            </section>

            {/* Content tabs */}
            <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
                <Tabs defaultValue="courses" className="w-full">
                    <TabsList className="mb-8 flex h-auto w-full justify-start gap-6 rounded-none border-b border-[#E7E2D8] bg-transparent p-0">
                        <TabsTrigger value="courses" className={tabTriggerClass}>
                            {t('mentor.stats.courses')} <span className="ml-1 font-medium text-[#94A3B8]">{courses.length}</span>
                        </TabsTrigger>
                        <TabsTrigger value="bootcamps" className={tabTriggerClass}>
                            {t('mentor.stats.bootcamps')} <span className="ml-1 font-medium text-[#94A3B8]">{bootcamps.length}</span>
                        </TabsTrigger>
                        <TabsTrigger value="articles" className={tabTriggerClass}>
                            {t('mentor.stats.articles')} <span className="ml-1 font-medium text-[#94A3B8]">{articles.length}</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="courses">
                        {courses.length > 0 ? (
                            <CardGrid>
                                {courses.map((course) => (
                                    <ProgramCard
                                        key={course.id}
                                        href={`/course/${course.slug}`}
                                        tags={levelLabels[course.level] ? [levelLabels[course.level]] : []}
                                        product={{
                                            id: course.id,
                                            title: course.title,
                                            slug: course.slug,
                                            thumbnail: course.thumbnail,
                                            category: course.category,
                                            type: 'course',
                                            price: course.discount_price ?? course.price,
                                            strikethrough_price: course.discount_price ? course.price : undefined,
                                        }}
                                    />
                                ))}
                            </CardGrid>
                        ) : (
                            <EmptyTab title={t('mentor.emptyCourseTitle')} description={t('mentor.emptyCourseDesc')} />
                        )}
                    </TabsContent>

                    <TabsContent value="bootcamps">
                        {bootcamps.length > 0 ? (
                            <CardGrid>
                                {bootcamps.map((bootcamp) => {
                                    const tags = [
                                        ...(bootcamp.batch ? [t('mentor.batch', { batch: bootcamp.batch })] : []),
                                        ...(bootcamp.is_registration_closed ? [t('mentor.registrationClosed')] : []),
                                    ];
                                    const card = (
                                        <ProgramCard
                                            href={`/bootcamp/${bootcamp.slug}`}
                                            tags={tags}
                                            product={{
                                                id: bootcamp.id,
                                                title: bootcamp.title,
                                                slug: bootcamp.slug,
                                                thumbnail: bootcamp.thumbnail,
                                                category: bootcamp.category,
                                                type: 'bootcamp',
                                                price: bootcamp.price,
                                                strikethrough_price: bootcamp.strikethrough_price,
                                                start_date: bootcamp.start_date,
                                                end_date: bootcamp.end_date,
                                            }}
                                        />
                                    );

                                    return bootcamp.is_registration_closed ? (
                                        <div key={bootcamp.id} aria-disabled="true" className="pointer-events-none h-full opacity-60 grayscale-[40%]">
                                            {card}
                                        </div>
                                    ) : (
                                        <div key={bootcamp.id} className="h-full">
                                            {card}
                                        </div>
                                    );
                                })}
                            </CardGrid>
                        ) : (
                            <EmptyTab title={t('mentor.emptyBootcampTitle')} description={t('mentor.emptyBootcampDesc')} />
                        )}
                    </TabsContent>

                    <TabsContent value="articles">
                        {articles.length > 0 ? (
                            <CardGrid>
                                {articles.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </CardGrid>
                        ) : (
                            <EmptyTab title={t('mentor.emptyArticleTitle')} description={t('mentor.emptyArticleDesc')} />
                        )}
                    </TabsContent>
                </Tabs>
            </section>
        </UserLayout>
    );
}
