import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import axios from 'axios';
import { AlertTriangle, CheckCircle2, Link2, Loader2, RefreshCw, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

export type BrevetParticipant = {
    user_id: string;
    name: string;
    email: string;
    phone_number: string | null;
    invoice_code: string | null;
    payment: 'paid' | 'installment';
    in_class: boolean;
};

export type BrevetStatus = {
    configured: boolean;
    course_code: string | null;
    platform: string | null;
    platforms: { code: string; name: string }[];
    course: { code: string; name: string; start_date: string | null; end_date: string | null; participants_count: number } | null;
    participants: BrevetParticipant[];
    summary: { eligible: number; in_class: number; missing: number };
    error: string | null;
    notice?: string | null;
};

type SendResult = { summary: Record<string, number>; results: { email: string; status: string; message: string | null }[] } | null;

const STATUS_LABEL: Record<string, string> = {
    created: 'akun baru',
    enrolled: 'masuk kelas',
    already: 'sudah di kelas',
    skipped_other_platform: 'dilewati (terdaftar di platform lain)',
    invalid: 'data tidak valid',
};

const selectClass =
    'border-input bg-background h-9 w-full rounded-md border px-3 text-sm shadow-xs focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none';

function errorMessage(error: any, fallback: string) {
    return error?.response?.data?.message ?? fallback;
}

export default function BrevetlearningPanel({ programId, onStatus }: { programId: string; onStatus: (status: BrevetStatus | null) => void }) {
    const [status, setStatus] = useState<BrevetStatus | null>(null);
    const [hidden, setHidden] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [code, setCode] = useState('');
    const [platform, setPlatform] = useState('');
    const [lastResult, setLastResult] = useState<SendResult>(null);
    const [expanded, setExpanded] = useState(false);

    const apply = useCallback(
        (data: BrevetStatus) => {
            setStatus(data);
            setCode(data.course_code ?? '');
            setPlatform(data.platform ?? '');
            onStatus(data);
        },
        [onStatus],
    );

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(route('certification-programs.brevetlearning.status', programId));
            apply(data);
        } catch (error: any) {
            // Tanpa izin kelola (mis. afiliasi): panel disembunyikan.
            if (error?.response?.status === 403) setHidden(true);
            else toast.error(errorMessage(error, 'Status brevetlearning tidak bisa dimuat.'));
            onStatus(null);
        } finally {
            setLoading(false);
        }
    }, [programId, apply, onStatus]);

    useEffect(() => {
        load();
    }, [load]);

    async function saveLink() {
        setBusy(true);
        try {
            const { data } = await axios.post(route('certification-programs.brevetlearning.link', programId), {
                course_code: code.trim(),
                platform: platform || null,
            });
            apply(data);
            setLastResult(null);
            toast.success(code.trim() ? `Terhubung ke kelas ${data.course?.name ?? code.trim()}.` : 'Kode kelas dihapus.');
        } catch (error: any) {
            toast.error(errorMessage(error, 'Gagal menyimpan kode kelas.'));
        } finally {
            setBusy(false);
        }
    }

    async function sendMissing() {
        setBusy(true);
        try {
            const { data } = await axios.post(route('certification-programs.brevetlearning.send', programId));
            apply(data);
            setLastResult(data.result);
            if (data.result) {
                const s = data.result.summary ?? {};
                const masuk = (s.created ?? 0) + (s.enrolled ?? 0);
                toast.success(`${masuk} peserta masuk kelas brevetlearning.`);
                if ((s.skipped_other_platform ?? 0) + (s.invalid ?? 0) > 0) {
                    toast.warning('Ada peserta yang tidak bisa dimasukkan. Lihat rinciannya di panel.');
                }
            } else {
                toast.info('Semua peserta sudah ada di kelas.');
            }
        } catch (error: any) {
            toast.error(errorMessage(error, 'Gagal mengirim peserta.'));
        } finally {
            setBusy(false);
        }
    }

    if (hidden) return null;

    // Program non-Brevet tidak perlu panel: selama belum ada kode kelas, cukup satu tombol kecil.
    if (status && !status.course_code && !status.notice && !expanded) {
        return status.configured ? (
            <div className="flex justify-end">
                <Button variant="ghost" size="sm" className="text-muted-foreground h-8 gap-1.5 text-xs" onClick={() => setExpanded(true)}>
                    <Link2 className="h-3.5 w-3.5" /> Hubungkan ke kelas brevetlearning (khusus program Brevet)
                </Button>
            </div>
        ) : null;
    }

    if (loading && !status) {
        return (
            <div className="text-muted-foreground flex items-center gap-2 rounded-lg border p-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat status brevetlearning…
            </div>
        );
    }


    const missing = status?.summary.missing ?? 0;
    const linked = !!status?.course_code;
    const failed = (lastResult?.results ?? []).filter((r) => r.status === 'skipped_other_platform' || r.status === 'invalid');

    return (
        <div className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium">
                    <Link2 className="h-4 w-4" /> Kelas brevetlearning
                </div>
                <div className="flex items-center gap-1">
                    {linked && (
                        <Button variant="ghost" size="sm" className="h-8" onClick={load} disabled={loading || busy}>
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Cek ulang
                        </Button>
                    )}
                    {!linked && (
                        <Button variant="ghost" size="sm" className="h-8" onClick={() => setExpanded(false)}>
                            Tutup
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <Input value={code} placeholder="Kode kelas, mis. XHQwcrf4" onChange={(e) => setCode(e.target.value)} />
                <select className={selectClass} value={platform} onChange={(e) => setPlatform(e.target.value)}>
                    <option value="">Platform induk…</option>
                    {(status?.platforms ?? []).map((p) => (
                        <option key={p.code} value={p.code}>
                            {p.name} ({p.code})
                        </option>
                    ))}
                </select>
                <Button variant="outline" onClick={saveLink} disabled={busy}>
                    {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {linked ? 'Simpan' : 'Cek & simpan'}
                </Button>
            </div>

            {status?.error && (
                <div className="flex gap-2 rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {status.error}
                </div>
            )}

            {status?.notice && (
                <div className="flex gap-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {status.notice}
                </div>
            )}

            {status?.course && (
                <div className="text-muted-foreground text-sm">
                    {status.course.name} · {status.course.participants_count} peserta di brevetlearning
                </div>
            )}

            {linked && !status?.error && (
                missing > 0 ? (
                    <div className="flex flex-col gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 sm:flex-row sm:items-center sm:justify-between dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                        <span className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            {missing} dari {status?.summary.eligible} peserta lunas/cicilan belum masuk kelas brevetlearning.
                        </span>
                        <Button size="sm" onClick={sendMissing} disabled={busy}>
                            <Send className="h-3.5 w-3.5" /> Kirim yang belum ({missing})
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="h-4 w-4" /> Semua {status?.summary.eligible} peserta lunas/cicilan sudah ada di kelas.
                    </div>
                )
            )}

            {failed.length > 0 && (
                <div className="space-y-1 rounded-md border p-2 text-sm">
                    <div className="font-medium">Tidak masuk kelas:</div>
                    {failed.map((r) => (
                        <div key={r.email} className="text-muted-foreground">
                            {r.email} — {r.message ?? STATUS_LABEL[r.status] ?? r.status}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
