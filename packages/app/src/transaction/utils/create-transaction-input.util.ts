import { TransactionCreateInputInterface } from '@budgie/contracts';

export const createTransactionInput = (
    input: Pick<TransactionCreateInputInterface, 'type' | 'fromAccountId' | 'toAccountId' | 'entries' | 'exchangeRate' | 'amount'> &
        Partial<Pick<TransactionCreateInputInterface, 'comment'>>
): TransactionCreateInputInterface => ({
    ...input,
    title: '',
    tagIds: [],
    comment: input.comment ?? '',
    externalId: null,
    externalSource: null,
    appliedRuleId: null,
    operatedAt: new Date(),
    entries: input.entries
});
