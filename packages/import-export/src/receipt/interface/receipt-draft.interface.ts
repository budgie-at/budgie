import type { CurrencyEnum } from '@budgie/contracts';

export interface ReceiptDraftInterface {
    readonly total: number;
    readonly currency: CurrencyEnum;
    readonly occurredAt: Date | null;
    readonly cardLast4: string | null;
    readonly receiptNumber: string | null;
    readonly merchantVatId: string | null;
    readonly merchantLegalName: string | null;
    readonly merchantCandidates: readonly string[];
    readonly fingerprint: string;
}
