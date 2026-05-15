import type { TransactionCreateInputInterface } from '@budgie/contracts';

export interface RuleCreatePreparationResultInterface {
    readonly transactionInputs: TransactionCreateInputInterface[];
    readonly postCreateIndexes: number[];
}
