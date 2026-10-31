import type { ReceiptMatchInputInterface } from '@budgie/ledger';

export interface PendingReceiptInterface {
    readonly receipt: ReceiptMatchInputInterface;
    readonly transactionId: number | null;
}
