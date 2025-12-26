import { TransactionCreateInputInterface } from '@budgie/contracts';

export const createTransactionInput = (
    input: Pick<TransactionCreateInputInterface, 'type' | 'fromAccountId' | 'toAccountId' | 'entries' | 'exchangeRate'>
): TransactionCreateInputInterface => ({
    ...input,
    title: '',
    amount: 0,
    tagIds: [],
    comment: '',
    externalId: null,
    externalSource: null,
    operatedAt: new Date(),
    entries: input.entries
});
