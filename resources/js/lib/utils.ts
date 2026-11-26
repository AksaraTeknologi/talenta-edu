import { usePage } from '@inertiajs/react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function useHasAnyPermission(permissions: string[]): boolean {
    const { auth } = usePage().props;
    const allPermissions = (auth as { permissions: Record<string, boolean> }).permissions;

    let hasPermission = false;

    permissions.forEach(function (item) {
        if (allPermissions[item]) hasPermission = true;
    });

    return hasPermission;
}

export const rupiahFormatter = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
});

export const parseRupiah = (value: string) => {
    return Number(value.replace(/[^0-9,-]+/g, '').replace(',', '.'));
};

export function formatExternalUrl(url?: string | null): string {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function decodeHtmlEntities(text: string): string {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ');
}

export function parseList(items?: string | null): string[] {
    if (!items) return [];

    const liRegex = /<li\b[^>]*>([\s\S]*?)<\/li>/gi;
    const list: string[] = [];
    let match: RegExpExecArray | null;

    while ((match = liRegex.exec(items)) !== null) {
        let text = match[1]
            .replace(/<[^>]*>/g, '')
            .replace(/&nbsp;/g, ' ')
            .replace(/\u00A0/g, ' ');
        text = decodeHtmlEntities(text).trim();
        text = text.replace(/^[-*•–—\u2022]+\s+/, '').trim();
        if (text) {
            list.push(text);
        }
    }

    if (list.length > 0) {
        return list;
    }

    const cleanText = items
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/?(p|div|tr|h[1-6])\b[^>]*>/gi, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\u00A0/g, ' ');

    const decoded = decodeHtmlEntities(cleanText);

    return decoded
        .split(/\r?\n/)
        .map((s) => s.replace(/^[-*•–—\u2022]+\s+/, '').trim())
        .filter((s) => s.length > 0);
}

/**
 * Resolve stored asset paths (e.g. `avatars/mentors/x.png` -> `/storage/avatars/mentors/x.png`)
 * while preserving absolute URLs, root-relative `/assets/...` paths, and data URIs.
 */
export function resolveStorageUrl(path?: string | null): string | undefined {
    if (!path) return undefined;
    const trimmed = path.trim();
    if (!trimmed) return undefined;
    if (/^(https?:\/\/|\/|data:)/i.test(trimmed)) {
        return trimmed;
    }
    return `/storage/${trimmed.replace(/^\/+/, '')}`;
}

/**
 * Calculate integer discount percentage when strikethrough price exceeds actual price.
 */
export function calculateDiscountPercent(strikethroughPrice?: number | null, price?: number | null): number {
    const original = Number(strikethroughPrice ?? 0);
    const current = Number(price ?? 0);
    if (original <= 0 || current < 0 || original <= current) {
        return 0;
    }
    return Math.round(((original - current) / original) * 100);
}

/**
 * Format a date string or Date object into readable Indonesian ("13 Desember 2026") or English ("13 December 2026").
 */
export function formatIndonesianDate(dateInput?: string | Date | null, lang = 'id'): string {
    if (!dateInput) return '-';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return '-';
    const locale = lang.startsWith('en') ? 'en-US' : 'id-ID';
    return date.toLocaleDateString(locale, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/**
 * Format a date-time string or Date object into Indonesian WIB ("19.00 WIB") or English ("19:00 WIB").
 */
export function formatIndonesianTime(dateInput?: string | Date | null, lang = 'id'): string {
    if (!dateInput) return '-';
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    if (isNaN(date.getTime())) return '-';
    const parts = new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Jakarta',
    }).format(date);
    const formatted = lang.startsWith('en') ? parts : parts.replace(':', '.');
    return `${formatted} WIB`;
}
