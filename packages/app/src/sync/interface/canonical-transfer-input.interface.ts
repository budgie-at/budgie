import type { TransactionConsolidationTypeEnum } from '@budgie/contracts';

export interface CanonicalTransferInputInterface {
    readonly title: string;
    readonly operatedAt: number;
    readonly fromAccountId: number;
    readonly toAccountId: number;
    readonly fromAmount: number;
    readonly toAmount: number;
    readonly exchangeRate: number;
    readonly consolidationType: TransactionConsolidationTypeEnum;
    readonly fromEntryExchangeRate: number;
    readonly toEntryExchangeRate: number;
    readonly fromEntryToIban: string | null;
}
