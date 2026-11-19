'use client';

import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from '@tanstack/react-table';

import { DataTablePagination } from '@/components/data-table-pagination';
import { DataTableServerPagination } from '@/components/data-table-server-pagination';
import { DataTableViewOptions } from '@/components/data-table-view-option';
import { PaginatedData } from '@/types/pagination';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { CalendarIcon, Download, X } from 'lucide-react';
import { router } from '@inertiajs/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data?: TData[] | PaginatedData<TData>;
    pagination?: PaginatedData<TData>;
    filters?: {
        search?: string;
        start_date?: string;
        end_date?: string;
        per_page?: number;
    };
}

function parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value + 'T00:00:00');
    return isNaN(date.getTime()) ? undefined : date;
}

function exportToExcel(filters: DataTableProps<unknown, unknown>['filters']) {
    // Gunakan filter yang sama dengan yang diterapkan di tabel (server-side / URL)
    const params = new URLSearchParams();
    if (filters?.start_date && filters?.end_date) {
        params.set('start_date', filters.start_date);
        params.set('end_date', filters.end_date);
    }
    if (filters?.search) params.set('search', filters.search);
    const query = params.toString() ? `?${params.toString()}` : '';
    window.location.href = route('earnings.export') + query;
}

export function DataTable<TData, TValue>({ columns, data, pagination, filters }: DataTableProps<TData, TValue>) {
    const paginationObj = pagination || (data && typeof data === 'object' && !Array.isArray(data) && 'data' in data ? (data as unknown as PaginatedData<TData>) : undefined);
    const tableData = paginationObj ? (paginationObj.data || []) : (Array.isArray(data) ? data : []);
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(() => {
        const from = parseDate(filters?.start_date);
        return from ? { from, to: parseDate(filters?.end_date) ?? from } : undefined;
    });
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false);

    // Server-side search state
    const [searchValue, setSearchValue] = useState(filters?.search ?? '');
    const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback((value: string) => {
        setSearchValue(value);
        if (debounceTimer.current) clearTimeout(debounceTimer.current);
        debounceTimer.current = setTimeout(() => {
            const searchParams = new URLSearchParams(window.location.search);
            if (value) {
                searchParams.set('search', value);
            } else {
                searchParams.delete('search');
            }
            searchParams.set('page', '1');
            router.get(
                `${window.location.pathname}?${searchParams.toString()}`,
                {},
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);
    }, []);

    // Sync searchValue when filters prop changes (e.g. navigating back)
    useEffect(() => {
        setSearchValue(filters?.search ?? '');
    }, [filters?.search]);

    // Sync dateRange saat filter dari server berubah (mis. navigasi back)
    useEffect(() => {
        const from = parseDate(filters?.start_date);
        setDateRange(from ? { from, to: parseDate(filters?.end_date) ?? from } : undefined);
    }, [filters?.start_date, filters?.end_date]);

    // Terapkan filter tanggal ke server agar berlaku untuk semua data, bukan hanya halaman aktif
    const applyDateRange = useCallback((range: DateRange | undefined) => {
        const searchParams = new URLSearchParams(window.location.search);
        if (range?.from) {
            searchParams.set('start_date', format(range.from, 'yyyy-MM-dd'));
            searchParams.set('end_date', format(range.to ?? range.from, 'yyyy-MM-dd'));
        } else {
            searchParams.delete('start_date');
            searchParams.delete('end_date');
        }
        searchParams.set('page', '1');
        router.get(
            `${window.location.pathname}?${searchParams.toString()}`,
            {},
            { preserveState: true, preserveScroll: true, replace: true },
        );
    }, []);

    const totalRows = paginationObj ? paginationObj.total : tableData.length;
    const hasDateFilter = !!(filters?.start_date && filters?.end_date);

    const table = useReactTable({
        data: tableData,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: paginationObj ? undefined : getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            rowSelection,
        },
    });

    const dateRangeLabel = React.useMemo(() => {
        if (!dateRange?.from) return 'Pilih rentang tanggal';
        if (!dateRange.to) return format(dateRange.from, 'd MMM yyyy', { locale: id });
        return `${format(dateRange.from, 'd MMM yyyy', { locale: id })} – ${format(dateRange.to, 'd MMM yyyy', { locale: id })}`;
    }, [dateRange]);

    return (
        <div>
            <div className="flex flex-col items-stretch gap-2 py-4 lg:flex-row lg:items-center">
                <Input
                    placeholder="Cari invoice / nama user / afiliator..."
                    value={searchValue}
                    onChange={(event) => handleSearch(event.target.value)}
                    className="lg:max-w-sm"
                />

                {/* Date Range Picker */}
                <div className="flex items-center gap-2">
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    'justify-start gap-2 text-left font-normal',
                                    !dateRange && 'text-muted-foreground',
                                )}
                            >
                                <CalendarIcon className="size-4" />
                                {dateRangeLabel}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                mode="range"
                                selected={dateRange}
                                onSelect={(range) => {
                                    setDateRange(range);
                                    if (range?.from && range?.to) {
                                        setIsCalendarOpen(false);
                                        applyDateRange(range);
                                    }
                                }}
                                numberOfMonths={2}
                                captionLayout="label"
                            />
                        </PopoverContent>
                    </Popover>

                    {dateRange && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                                setDateRange(undefined);
                                applyDateRange(undefined);
                            }}
                            className="text-muted-foreground hover:text-foreground"
                            title="Reset filter tanggal"
                        >
                            <X className="size-4" />
                        </Button>
                    )}
                </div>

                <div className="flex items-center gap-2 lg:ml-auto">
                    {/* Export Button */}
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => exportToExcel(filters)}
                    >
                        <Download className="size-4" />
                        Export Excel
                        {hasDateFilter && (
                            <span className="text-muted-foreground text-xs">
                                ({totalRows} baris)
                            </span>
                        )}
                    </Button>
                    <DataTableViewOptions table={table} />
                </div>
            </div>

            {/* Info filter aktif */}
            {hasDateFilter && dateRange?.from && (
                <div className="bg-muted/50 mb-3 flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    <CalendarIcon className="text-muted-foreground size-3.5" />
                    <span>
                        Menampilkan <strong>{totalRows}</strong> data
                        {dateRange.from && (
                            <>
                                {' '}untuk periode{' '}
                                <strong>
                                    {format(dateRange.from, 'd MMM yyyy', { locale: id })}
                                    {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime()
                                        ? ` – ${format(dateRange.to, 'd MMM yyyy', { locale: id })}`
                                        : ''}
                                </strong>
                            </>
                        )}
                    </span>
                </div>
            )}

            <div className="w-[1000px] max-w-full min-w-full overflow-x-auto rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                    Tidak ada data.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="py-4">
                {paginationObj ? (
                    <DataTableServerPagination pagination={paginationObj} />
                ) : (
                    <DataTablePagination table={table} />
                )}
            </div>
        </div>
    );
}
