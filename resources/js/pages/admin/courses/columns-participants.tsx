'use client';

import { DataTableColumnHeader } from '@/components/data-table-column-header';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CheckCircle, Clock, Lock } from 'lucide-react';

interface User {
    id: string;
    name: string;
    email: string;
    phone_number: string | null;
}

interface CourseItem {
    id: string;
    progress: number;
    completed_at: string | null;
}

interface PaymentInfo {
    is_installment: boolean;
    is_fully_paid: boolean;
    paid_terms: number;
    total_terms: number;
    access_suspended_at: string | null;
}

export interface Participant {
    id: string;
    invoice_code: string;
    user: User;
    course_item: CourseItem;
    payment: PaymentInfo;
    enrolled_at: string | null;
}

export const participantColumns: ColumnDef<Participant>[] = [
    {
        accessorKey: 'user.name',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Nama Peserta" />,
        cell: ({ row }) => (
            <div>
                <p className="font-medium">{row.original.user.name}</p>
                <p className="text-muted-foreground text-xs">{row.original.user.email}</p>
            </div>
        ),
    },
    {
        accessorKey: 'user.phone_number',
        header: ({ column }) => <DataTableColumnHeader column={column} title="No. HP" />,
        cell: ({ row }) => <p className="text-sm">{row.original.user.phone_number || '-'}</p>,
    },
    {
        id: 'payment_status',
        accessorFn: (row) => (row.payment.is_fully_paid ? 'lunas' : 'dp'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status Pembayaran" />,
        cell: ({ row }) => {
            const { payment, invoice_code } = row.original;

            return (
                <div className="space-y-1">
                    {payment.is_fully_paid ? (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Lunas</Badge>
                    ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">Sudah DP</Badge>
                    )}
                    {payment.is_installment && (
                        <p className="text-muted-foreground text-xs">
                            Cicilan {payment.paid_terms}/{payment.total_terms} termin
                        </p>
                    )}
                    {payment.access_suspended_at && (
                        <p className="flex items-center gap-1 text-xs text-red-600">
                            <Lock className="h-3 w-3" />
                            Akses dibekukan
                        </p>
                    )}
                    <p className="text-muted-foreground text-xs">{invoice_code}</p>
                </div>
            );
        },
    },
    {
        id: 'progress',
        accessorFn: (row) => row.course_item.progress,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Progress" />,
        cell: ({ row }) => {
            const progress = row.original.course_item.progress || 0;
            return (
                <div className="flex items-center gap-2">
                    <Progress value={progress} className="h-2 w-24" />
                    <span className="text-sm font-medium">{Math.round(progress)}%</span>
                </div>
            );
        },
    },
    {
        id: 'status',
        accessorFn: (row) => (row.course_item.completed_at ? 'selesai' : 'aktif'),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) =>
            row.original.course_item.completed_at ? (
                <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Selesai
                </Badge>
            ) : (
                <Badge>
                    <Clock className="mr-1 h-3 w-3" />
                    Aktif
                </Badge>
            ),
    },
    {
        accessorKey: 'enrolled_at',
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tanggal Bergabung" />,
        cell: ({ row }) => {
            const date = row.original.enrolled_at;
            return <p className="text-sm">{date ? format(new Date(date), 'dd MMM yyyy HH:mm', { locale: id }) : '-'}</p>;
        },
    },
];
