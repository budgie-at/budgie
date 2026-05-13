import { TransactionCreateInputInterface } from '@budgie/contracts';

export const createTransactionInput = (
    input: Pick<TransactionCreateInputInterface, 'type' | 'fromAccountId' | 'toAccountId' | 'entries' | 'exchangeRate' | 'amount'> &
        Partial<Pick<TransactionCreateInputInterface, 'comment'>>
): TransactionCreateInputInterface => ({
    ...input,
    title: '',
    tagIds: [],
    comment: input.comment ?? '',
    updatedBy: null,
    externalId: null,
    externalSource: null,
    operatedAt: new Date(),
    entries: input.entries
});
