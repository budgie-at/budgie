import type { TransactionCreateInputInterface } from '@budgie/contracts';

export interface ImportedBatchPreparationInterface {
    readonly externalIdMap: Map<string, number>;
    readonly transactionInputs: TransactionCreateInputInterface[];
}
