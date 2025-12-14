import { TransactionCreateEntityInterface } from '@budgie/contracts';

export const createTransactionInput = (
    input: Pick<TransactionCreateEntityInterface, 'type' | 'fromAccountId' | 'toAccountId' | 'entries' | 'exchangeRate'>
): TransactionCreateEntityInterface => ({
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
