import { TransactionCreateInputInterface, TransactionEntryCreateInputInterface } from '@budgie/contracts';

interface RuleEvaluationEntryInterface extends Pick<
    TransactionEntryCreateInputInterface,
    'type' | 'categoryId' | 'accountId' | 'amount' | 'mccCategoryId'
> {
    readonly mccCode: string | null;
}

export interface RuleEvaluationInputInterface extends Omit<TransactionCreateInputInterface, 'entries'> {
    readonly entries: RuleEvaluationEntryInterface[];
}
