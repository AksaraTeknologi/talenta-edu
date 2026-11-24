interface TermLike {
    status: string;
    invoice_url?: string | null;
}

interface InvoiceLike {
    status: string;
    is_installment?: boolean;
    installment_terms?: TermLike[];
    installmentTerms?: TermLike[];
}

const getTerms = (invoice: InvoiceLike): TermLike[] => invoice.installment_terms || invoice.installmentTerms || [];

/**
 * Deteksi cicilan sama dengan kolom status tabel transaksi.
 * Cicilan tanpa termin (tampil "0/0") menghasilkan 0 transaksi.
 */
const isInstallmentInvoice = (invoice: InvoiceLike): boolean =>
    !!invoice.is_installment || invoice.status === 'installment_pending' || getTerms(invoice).length > 0;

/**
 * Termin cicilan hanya dihitung sebagai transaksi jika sudah dibayar.
 * Cicilan yang belum ada termin terbayar (mis. "0/2") tidak dihitung.
 */
const isTermTransacted = (term: TermLike): boolean => term.status === 'paid';

/**
 * Hitung total transaksi pembayaran.
 * Invoice biasa = 1 transaksi; invoice cicilan = jumlah termin yang sudah ditransaksikan.
 */
export function countTransactions(transactions: InvoiceLike[]): number {
    return transactions.reduce((total, invoice) => {
        const terms = getTerms(invoice);
        if (isInstallmentInvoice(invoice)) {
            return total + terms.filter(isTermTransacted).length;
        }
        return total + 1;
    }, 0);
}

/**
 * Hitung transaksi pembayaran yang sudah lunas (paid).
 */
export function countPaidTransactions(transactions: InvoiceLike[]): number {
    return transactions.reduce((total, invoice) => {
        const terms = getTerms(invoice);
        if (isInstallmentInvoice(invoice)) {
            return total + terms.filter((t) => t.status === 'paid').length;
        }
        return total + (invoice.status === 'paid' || invoice.status === 'completed' ? 1 : 0);
    }, 0);
}
