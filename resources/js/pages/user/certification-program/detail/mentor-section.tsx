import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { resolveStorageUrl } from '@/lib/utils';
import { Link } from '@inertiajs/react';
import { useTranslation } from 'react-i18next';

interface Mentor {
    id: string;
    name: string;
    bio?: string;
    avatar?: string;
}

interface CertificationProgram {
    mentors?: Mentor[];
}

export default function MentorSection({ program }: { program: CertificationProgram }) {
    const { t } = useTranslation('user');
    const getInitials = useInitials();
    const mentors = program.mentors || [];

    if (mentors.length === 0) {
        return null;
    }

    return (
        <section className="rounded-2xl border border-[#DCE3EC] bg-white p-5 shadow-xs sm:p-6" id="mentors">
            <h2 className="font-literata text-xl font-bold text-[#12344E] sm:text-2xl">
                {t('certificationProgram.detail.about.badgeMentors', 'Mentor Program')}
            </h2>
            <p className="mt-1 mb-5 text-sm text-[#5B6B7F]">
                {t('certificationProgram.detail.mentors.subtitle', 'Mentor profesional yang akan membimbing Anda selama program sertifikasi')}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
                {mentors.map((mentor) => (
                    <Link
                        key={mentor.id}
                        href={`/mentor/${mentor.id}`}
                        className="group flex items-start gap-4 rounded-xl border border-[#DCE3EC] bg-[#FAF8F4] p-4 transition-colors hover:border-[#93C5FD] hover:bg-white"
                    >
                        <Avatar className="h-14 w-14 shrink-0 border border-[#DCE3EC] bg-[#EAF3FC]">
                            <AvatarImage src={resolveStorageUrl(mentor.avatar)} alt={mentor.name} className="object-cover" />
                            <AvatarFallback className="bg-[#12344E] text-base font-bold text-white">
                                {getInitials(mentor.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-[#162230] transition-colors group-hover:text-[#1976D3]">
                                {mentor.name}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#475569] sm:text-sm">
                                {mentor.bio || t('certificationProgram.detail.mentors.defaultBio', 'Mentor profesional Talenta Academy')}
                            </p>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
