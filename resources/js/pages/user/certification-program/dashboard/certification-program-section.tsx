import { CatalogSection, type CatalogItem } from '@/components/catalog-section';
import { useTranslation } from 'react-i18next';

type Category = {
    id: string;
    name: string;
};

interface Program {
    id: string;
    title: string;
    slug: string;
    short_description: string;
    type: 'regular' | 'scholarship';
    category: Category;
    price: number;
    scholarship_price?: number;
    strikethrough_price?: number;
    thumbnail?: string | null;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
    mentors?: Array<{
        name: string;
    }>;
}

interface MyProgramIds {
    certificationPrograms?: string[];
}

interface CertificationProgramSectionProps {
    categories: Category[];
    programs: Program[];
    myProgramIds?: string[] | MyProgramIds;
    approvedScholarshipProgramIds?: string[];
}

export default function CertificationProgramSection({ categories, programs, myProgramIds, approvedScholarshipProgramIds = [] }: CertificationProgramSectionProps) {
    const { t } = useTranslation('user');

    const safeMyProgramIds = Array.isArray(myProgramIds) ? myProgramIds : myProgramIds?.certificationPrograms || [];

    const items: CatalogItem[] = programs.map((program) => {
        const isScholarship = program.type === 'scholarship';
        const isApprovedScholarship = isScholarship && approvedScholarshipProgramIds.includes(program.id);
        const isScholarshipNotApproved = isScholarship && !isApprovedScholarship;
        const displayPrice = isScholarshipNotApproved ? 0 : isScholarship ? (program.scholarship_price ?? program.price) : program.price;
        const hasAccess = safeMyProgramIds.includes(program.id);

        return {
            id: program.id,
            href: hasAccess ? route('profile.certification-program.detail', program.slug) : route('certification-programs.detail', program.slug),
            hasAccess,
            mentorName: program.mentors?.length ? program.mentors.map((mentor) => mentor.name).join(', ') : null,
            tags: [
                isScholarship
                    ? t('certificationProgram.dashboard.catalog.badgeScholarship', 'Beasiswa')
                    : t('certificationProgram.dashboard.catalog.badgeRegular', 'Reguler'),
            ],
            product: {
                ...program,
                type: 'certification-program',
                program_type: program.type,
                price: displayPrice,
                strikethrough_price: isScholarshipNotApproved ? undefined : program.strikethrough_price,
            },
        };
    });

    return (
        <CatalogSection
            id="certification-programs"
            title={t('certificationProgram.dashboard.headTitle', 'Program Sertifikasi')}
            items={items}
            categories={categories}
            searchPlaceholder={t('certificationProgram.dashboard.catalog.searchPlaceholder', 'Cari program sertifikasi...')}
            emptyText={t('certificationProgram.dashboard.catalog.emptyPrograms', 'Belum ada program sertifikasi yang tersedia saat ini.')}
            allLabel={t('certificationProgram.dashboard.catalog.allCategories', 'Semua')}
            loadMoreLabel={t('certificationProgram.dashboard.catalog.loadMore', 'Lihat Lebih Banyak')}
        />
    );
}
