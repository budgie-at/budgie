import { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateEntityInterface, 'type' | 'instrumentId' | 'accountId'> &
        Partial<Pick<TransactionEntryCreateEntityInterface, 'categoryId'>>
): Omit<TransactionEntryCreateEntityInterface, 'transactionId'> => ({
    categoryId: 0,
    amount: 0,
    ...input
});
