import type { TransactionCreateInputInterface } from '@budgie/contracts';

export interface PendingTransactionBatchInterface {
    readonly transactionIds: number[];
    readonly transactionInputs: TransactionCreateInputInterface[];
}
