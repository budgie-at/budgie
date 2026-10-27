import type { ReceiptScanFailureEnum } from '../enum/receipt-scan-failure.enum';
import type { ReceiptScanFallbackInterface } from './receipt-scan-fallback.interface';
import type { CurrencyEnum } from '@budgie/contracts';
import type { ReceiptMatchResultKindEnum } from '@budgie/ledger';

export interface ReceiptScanResultInterface {
    readonly kind: ReceiptMatchResultKindEnum | ReceiptScanFailureEnum;
    readonly transactionId: number | null;
    readonly title: string;
    readonly amount: number | null;
    readonly currency: CurrencyEnum | null;
    readonly fallback: ReceiptScanFallbackInterface | null;
}
