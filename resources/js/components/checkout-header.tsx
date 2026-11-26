import { LanguageSwitcher } from '@/components/language-switcher';
import { Link } from '@inertiajs/react';
import { ArrowLeft, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CheckoutHeaderProps {
    backHref: string;
    backLabel?: string;
}

export function CheckoutHeader({ backHref, backLabel }: CheckoutHeaderProps) {
    const { t } = useTranslation('user');

    return (
        <header className="sticky top-0 z-30 border-b border-[#DCE3EC] bg-white/95 backdrop-blur-sm">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                    <Link href="/" className="flex shrink-0 items-center" aria-label="Talenta Academy">
                        <img src="/assets/images/logo-primary-2.png" alt="Talenta Academy" className="h-7 w-auto sm:h-8" />
                    </Link>
                    <span className="h-5 w-px shrink-0 bg-[#DCE3EC]" aria-hidden="true" />
                    <Link
                        href={backHref}
                        className="inline-flex min-h-10 items-center gap-1.5 truncate text-xs font-medium text-[#475569] transition-colors hover:text-[#1976D3] sm:text-sm"
                    >
                        <ArrowLeft className="h-4 w-4 shrink-0" />
                        <span className="truncate">{backLabel || t('webinar.register.backToDetail', 'Kembali ke Detail')}</span>
                    </Link>
                </div>

                <div className="flex shrink-0 items-center gap-3">
                    <LanguageSwitcher variant="segmented" />
                    <div className="hidden items-center gap-1.5 rounded-full border border-[#DCE3EC] bg-[#F2F6FA] px-3 py-1.5 text-xs font-medium text-[#12344E] sm:inline-flex">
                        <Lock className="h-3.5 w-3.5 text-[#15803D]" />
                        <span>{t('webinar.register.secureHeaderLabel', 'Pendaftaran Aman')}</span>
                    </div>
                </div>
            </div>
        </header>
    );
}
