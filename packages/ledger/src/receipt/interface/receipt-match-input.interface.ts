import type { CurrencyEnum } from '@budgie/contracts';

export interface ReceiptMatchInputInterface {
    readonly total: number;
    readonly currency: CurrencyEnum;
    readonly occurredAt: Date;
    readonly cardLast4: string | null;
    readonly receiptNumber: string | null;
    readonly merchantVatId: string | null;
    readonly merchantLegalName: string | null;
    readonly merchantCandidates: readonly string[];
    readonly fingerprint: string;
    readonly title: string;
    readonly description: string | null;
    readonly categoryId: number | null;
}
