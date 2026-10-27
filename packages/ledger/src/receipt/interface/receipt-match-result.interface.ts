import type { ReceiptMatchResultKindEnum } from '../enum/receipt-match-result-kind.enum';

export interface ReceiptMatchResultInterface {
    readonly kind: ReceiptMatchResultKindEnum;
    readonly transactionId: number;
}
