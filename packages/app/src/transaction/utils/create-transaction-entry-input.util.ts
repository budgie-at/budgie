import { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateEntityInterface, 'type' | 'instrumentId' | 'accountId' | 'amount'> &
        Partial<Pick<TransactionEntryCreateEntityInterface, 'categoryId'>>
): Omit<TransactionEntryCreateEntityInterface, 'transactionId'> => ({
    categoryId: 0,
    ...input
});
