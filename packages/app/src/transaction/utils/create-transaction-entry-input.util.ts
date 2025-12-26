import { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateEntityInterface, 'type' | 'accountId'> &
        Partial<Pick<TransactionEntryCreateEntityInterface, 'amount' | 'categoryId'>>
): Omit<TransactionEntryCreateEntityInterface, 'transactionId'> => ({
    amount: 0,
    categoryId: 0,
    ...input
});
