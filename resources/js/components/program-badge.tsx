import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export type ProgramType = 'course' | 'bootcamp' | 'webinar' | 'bundle' | 'certification-program';

interface ProgramBadgeProps {
    type: ProgramType;
    labelOverride?: string;
    className?: string;
}

const badgeStyleMap: Record<ProgramType, string> = {
    bootcamp: 'border-[#12344E] bg-[#12344E] text-white',
    webinar: 'border-[#BFDBFE] bg-[#EAF3FC] text-[#155FA8]',
    course: 'border-[#CBD5E1] bg-[#F2F6FA] text-[#162230]',
    bundle: 'border-[#FED7AA] bg-[#FFF3EB] text-[#B8470A]',
    'certification-program': 'border-[#12344E] bg-white text-[#12344E]',
};

export function ProgramBadge({ type, labelOverride, className }: ProgramBadgeProps) {
    const { t } = useTranslation(['home', 'user']);

    const defaultLabels: Record<ProgramType, string> = {
        course: t('home:latest.badges.course', 'Kelas Online'),
        bootcamp: t('home:latest.badges.bootcamp', 'Bootcamp'),
        webinar: t('home:latest.badges.webinar', 'Webinar'),
        bundle: t('home:latest.badges.bundle', 'Bundling'),
        'certification-program': t('home:latest.badges.certification', 'Sertifikasi'),
    };

    return (
        <Badge
            variant="outline"
            className={cn('rounded-md px-2.5 py-0.5 text-xs font-semibold tracking-tight', badgeStyleMap[type], className)}
        >
            {labelOverride || defaultLabels[type]}
        </Badge>
    );
}
