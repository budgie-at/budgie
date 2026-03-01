import { TransactionCreateInputInterface } from '@budgie/contracts';

interface RuleEvaluationEntryInterface {
    readonly type: TransactionCreateInputInterface['entries'][number]['type'];
    readonly categoryId: TransactionCreateInputInterface['entries'][number]['categoryId'];
    readonly accountId: TransactionCreateInputInterface['entries'][number]['accountId'];
    readonly amount: TransactionCreateInputInterface['entries'][number]['amount'];
    readonly mccCategoryId: TransactionCreateInputInterface['entries'][number]['mccCategoryId'];
    readonly mccCode: string | null;
}

export interface RuleEvaluationInputInterface extends Omit<TransactionCreateInputInterface, 'entries'> {
    readonly entries: RuleEvaluationEntryInterface[];
}
