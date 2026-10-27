import type { CurrencyEnum } from '@budgie/contracts';

export interface ReceiptTotalInterface {
    readonly amount: number;
    readonly currency: CurrencyEnum | null;
    readonly paymentRows: readonly string[];
}
