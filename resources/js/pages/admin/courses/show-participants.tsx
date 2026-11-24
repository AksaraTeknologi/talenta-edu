import { participantColumns, type Participant } from './columns-participants';
import { DataTable } from './data-table-participants';

interface CourseParticipantProps {
    participants: Participant[];
}

export default function CourseParticipant({ participants }: CourseParticipantProps) {
    const fullyPaidCount = participants.filter((p) => p.payment.is_fully_paid).length;
    const dpCount = participants.length - fullyPaidCount;

    return (
        <div className="h-full space-y-6 rounded-lg border p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <h2 className="text-lg font-medium">Data Peserta Kelas</h2>
                {participants.length > 0 && (
                    <div className="text-muted-foreground flex gap-4 text-sm">
                        <span>
                            Total: <span className="text-foreground font-semibold">{participants.length}</span>
                        </span>
                        <span>
                            Lunas: <span className="font-semibold text-green-600">{fullyPaidCount}</span>
                        </span>
                        <span>
                            Sudah DP: <span className="font-semibold text-yellow-600">{dpCount}</span>
                        </span>
                    </div>
                )}
            </div>

            {participants.length > 0 ? (
                <DataTable columns={participantColumns} data={participants} />
            ) : (
                <div className="flex flex-col items-center justify-center gap-4 py-12">
                    <img src="/assets/images/not-found.webp" alt="Peserta Tidak Tersedia" className="w-48" />
                    <p className="text-muted-foreground text-center text-sm">Belum ada peserta untuk kelas ini.</p>
                </div>
            )}
        </div>
    );
}
