import { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateEntityInterface, 'type' | 'instrumentId' | 'accountId'>
): Omit<TransactionEntryCreateEntityInterface, 'transactionId'> => ({
    ...input,
    amount: 0,
    categoryId: 0
});
