import type { TransactionEntryCreateInputInterface } from '@budgie/contracts';

export interface ConvertToTransferParamsInterface {
    readonly id: number;
    readonly accountId: number;
    readonly customExchangeRate: number;
    readonly feeEntries: readonly Omit<TransactionEntryCreateInputInterface, 'accountId'>[];
}
