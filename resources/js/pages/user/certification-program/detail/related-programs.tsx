import { ProgramCard } from '@/components/program-card';
import { useTranslation } from 'react-i18next';

interface RelatedProgram {
    id: string;
    title: string;
    slug: string;
    type: 'regular' | 'scholarship';
    price: number;
    strikethrough_price?: number;
    category?: { name: string };
    thumbnail?: string | null;
    registration_deadline?: string;
    socialization_registration_deadline?: string;
}

export default function RelatedPrograms({
    relatedPrograms,
    approvedScholarshipProgramIds = [],
    myProgramIds = [],
}: {
    relatedPrograms: RelatedProgram[];
    approvedScholarshipProgramIds?: string[];
    myProgramIds?: string[];
}) {
    const { t } = useTranslation('user');

    if (!relatedPrograms || relatedPrograms.length === 0) return null;

    return (
        <section className="mt-14 border-t border-[#DCE3EC] pt-12" id="related">
            <div className="mb-8">
                <h2 className="font-literata text-2xl font-bold text-[#12344E] sm:text-3xl">
                    {t('certificationProgram.detail.related.title', 'Program Sertifikasi Lainnya')}
                </h2>
                <p className="mt-1.5 text-sm text-[#475569] sm:text-base">
                    {t('certificationProgram.detail.related.subtitle', 'Program sertifikasi lain yang mungkin menarik untuk Anda')}
                </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {relatedPrograms.map((program) => {
                    const hasAccess = myProgramIds.includes(program.id);
                    const isApprovedScholarship = program.type === 'scholarship' && approvedScholarshipProgramIds?.includes(program.id);
                    const isScholarshipNotApproved = program.type === 'scholarship' && !isApprovedScholarship;
                    const displayPrice = isScholarshipNotApproved ? 0 : program.price;

                    return (
                        <ProgramCard
                            key={program.id}
                            product={{
                                id: program.id,
                                title: program.title,
                                slug: program.slug,
                                thumbnail: program.thumbnail,
                                price: displayPrice,
                                strikethrough_price: isScholarshipNotApproved ? 0 : program.strikethrough_price,
                                registration_deadline: program.registration_deadline,
                                socialization_registration_deadline: program.socialization_registration_deadline,
                                program_type: program.type,
                                category: program.category,
                                type: 'certification-program',
                            }}
                            href={
                                hasAccess
                                    ? route('profile.certification-program.detail', program.slug)
                                    : route('certification-programs.detail', program.slug)
                            }
                            hasAccess={hasAccess}
                        />
                    );
                })}
            </div>
        </section>
    );
}
