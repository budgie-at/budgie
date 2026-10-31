import type { ReceiptScanFailureEnum } from '../enum/receipt-scan-failure.enum';
import type { CurrencyEnum } from '@budgie/contracts';
import type { ReceiptMatchInputInterface, ReceiptMatchResultKindEnum } from '@budgie/ledger';

export interface ReceiptProposalInterface {
    readonly kind: ReceiptMatchResultKindEnum | ReceiptScanFailureEnum;
    readonly transactionId: number | null;
    readonly title: string;
    readonly comment: string;
    readonly amount: number | null;
    readonly currency: CurrencyEnum | null;
    readonly categoryId: number | null;
    readonly accountId: number | null;
    readonly operatedAt: Date | null;
    readonly aiContext: string;
    readonly receipt: ReceiptMatchInputInterface | null;
}
