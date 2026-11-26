import { ProgramBadge, ProgramType } from '@/components/program-badge';
import { Button } from '@/components/ui/button';
import UserLayout from '@/layouts/user-layout';
import { resolveStorageUrl } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, BookOpen, Calendar, Crown, FileText, Home, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CourseItem {
    course: { title: string; slug: string; thumbnail: string };
}
interface BootcampItem {
    bootcamp: { title: string; slug: string; thumbnail: string };
}
interface WebinarItem {
    webinar: { title: string; slug: string; thumbnail: string };
}
interface CertificationProgramItem {
    certification_program: { title: string; slug: string; thumbnail: string; group_url?: string | null };
}

interface Invoice {
    id: string;
    amount: number;
    course_items?: CourseItem[];
    bootcamp_items?: BootcampItem[];
    webinar_items?: WebinarItem[];
    certification_program_items?: CertificationProgramItem[];
}

interface InvoiceProps {
    invoice: Invoice;
}

export default function CheckoutSuccess({ invoice }: InvoiceProps) {
    const { t } = useTranslation('user');
    const courseItems = invoice.course_items ?? [];
    const bootcampItems = invoice.bootcamp_items ?? [];
    const webinarItems = invoice.webinar_items ?? [];
    const certificationProgramItems = invoice.certification_program_items ?? [];

    let title = '';
    let subtitle = '';
    let link = '';
    let label = '';
    let thumbnail = '';
    let icon = <Crown className="h-5 w-5 text-[#1976D3]" />;
    let programType: ProgramType | null = null;

    if (courseItems.length > 0) {
        title = courseItems[0].course.title;
        subtitle = t('checkoutSuccess.onlineCourse');
        link = `/profile/my-courses/${courseItems[0].course.slug}`;
        label = t('checkoutSuccess.startLearning');
        thumbnail = courseItems[0].course.thumbnail;
        icon = <BookOpen className="h-5 w-5 text-[#1976D3]" />;
        programType = 'course';
    } else if (bootcampItems.length > 0) {
        title = bootcampItems[0].bootcamp.title;
        subtitle = t('checkoutSuccess.bootcamp');
        link = `/profile/my-bootcamps/${bootcampItems[0].bootcamp.slug}`;
        label = t('checkoutSuccess.accessBootcamp');
        thumbnail = bootcampItems[0].bootcamp.thumbnail;
        icon = <Sparkles className="h-5 w-5 text-[#1976D3]" />;
        programType = 'bootcamp';
    } else if (webinarItems.length > 0) {
        title = webinarItems[0].webinar.title;
        subtitle = t('checkoutSuccess.webinar');
        link = `/profile/my-webinars/${webinarItems[0].webinar.slug}`;
        label = t('checkoutSuccess.accessWebinar');
        thumbnail = webinarItems[0].webinar.thumbnail;
        icon = <Calendar className="h-5 w-5 text-[#1976D3]" />;
        programType = 'webinar';
    } else if (certificationProgramItems.length > 0) {
        title = t('checkoutSuccess.certificationTitle', { title: certificationProgramItems[0].certification_program.title });
        subtitle = t('checkoutSuccess.certificationProgram', 'Sertifikasi');
        link = `/profile/my-certification-programs/${certificationProgramItems[0].certification_program.slug}`;
        label = t('checkoutSuccess.accessCertification');
        thumbnail = certificationProgramItems[0].certification_program.thumbnail;
        icon = <Home className="h-5 w-5 text-[#1976D3]" />;
        programType = 'certification-program';
    } else {
        title = t('checkoutSuccess.purchaseSuccessful');
        subtitle = t('checkoutSuccess.thankYou');
        link = '/profile';
        label = t('checkoutSuccess.viewProfile');
        icon = <Crown className="h-5 w-5 text-[#1976D3]" />;
    }

    const thumbnailSrc = resolveStorageUrl(thumbnail);

    return (
        <UserLayout>
            <Head title={t('checkoutSuccess.paymentSuccess')} />

            <div className="min-h-screen bg-[#FAF8F4] pb-24 sm:pb-16">
                <section className="mx-auto max-w-4xl px-4 pt-10 sm:px-6 sm:pt-14">
                    {/* Confirmation Banner */}
                    <div className="rounded-2xl border border-[#BBF7D0] bg-white p-6 text-center shadow-sm sm:p-10">
                        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                            <BadgeCheck className="h-9 w-9 text-[#15803D]" />
                        </div>

                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-1 text-xs font-semibold text-[#15803D]">
                            {t('checkoutSuccess.paymentSuccess')}
                        </span>

                        <h1 className="font-literata mt-4 text-2xl font-bold text-[#12344E] sm:text-4xl">
                            {t('checkoutSuccess.congratulations')}
                        </h1>
                        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-[#475569] sm:text-base">
                            {t('checkoutSuccess.transactionProcessed')} {t('checkoutSuccess.invoiceCanBeDownloaded')}
                        </p>
                    </div>

                    {/* Purchased Program & Actions */}
                    <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                        <div className="overflow-hidden rounded-2xl border border-[#DCE3EC] bg-white shadow-sm lg:col-span-7">
                            <div className="border-b border-[#DCE3EC] bg-[#FAF8F4] px-5 py-4">
                                <div className="mb-2 flex items-center gap-2">
                                    {programType ? (
                                        <ProgramBadge type={programType} labelOverride={subtitle} />
                                    ) : (
                                        <span className="rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                                            {subtitle}
                                        </span>
                                    )}
                                </div>
                                <h2 className="font-literata text-xl font-bold leading-snug text-[#12344E]">{title}</h2>
                            </div>

                            {thumbnailSrc && (
                                <div className="bg-[#FAF8F4] p-4 sm:p-5">
                                    <img
                                        src={thumbnailSrc}
                                        alt={title}
                                        className="max-h-64 w-full rounded-xl border border-[#DCE3EC] bg-white object-contain p-2"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-4 lg:col-span-5">
                            <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#EAF3FC]">
                                    {icon}
                                </div>
                                <h3 className="font-literata text-lg font-bold text-[#12344E]">{t('checkoutSuccess.accessNow')}</h3>
                                <p className="mt-1 mb-4 text-sm text-[#475569]">{t('checkoutSuccess.startLearningDesc')}</p>
                                <Button asChild size="lg" className="h-12 w-full font-semibold">
                                    <Link href={link}>{label}</Link>
                                </Button>
                            </div>

                            <div className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-sm sm:p-6">
                                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[#F2F6FA]">
                                    <FileText className="h-5 w-5 text-[#12344E]" />
                                </div>
                                <h3 className="font-literata text-lg font-bold text-[#12344E]">{t('checkoutSuccess.downloadInvoiceTitle')}</h3>
                                <p className="mt-1 mb-4 text-sm text-[#475569]">{t('checkoutSuccess.saveReceiptDesc')}</p>
                                <Button asChild variant="outline" size="lg" className="h-11 w-full">
                                    <a href={route('invoice.pdf', { id: invoice.id })} target="_blank" rel="noopener noreferrer">
                                        <FileText className="mr-2 h-4 w-4" />
                                        {t('checkoutSuccess.downloadInvoice')}
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </UserLayout>
    );
}