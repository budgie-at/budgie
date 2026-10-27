import type { ReceiptScanFailureEnum } from '../enum/receipt-scan-failure.enum';
import type { ReceiptScanFallbackInterface } from './receipt-scan-fallback.interface';
import type { ReceiptMatchResultKindEnum } from '@budgie/ledger';

export interface ReceiptScanResultInterface {
    readonly kind: ReceiptMatchResultKindEnum | ReceiptScanFailureEnum;
    readonly transactionId: number | null;
    readonly title: string;
    readonly fallback: ReceiptScanFallbackInterface | null;
}
