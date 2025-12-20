import { TransactionEntryCreateInputInterface } from '../schema/transaction-create-input.schema';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateInputInterface, 'type' | 'accountId' | 'instrumentId'> &
        Partial<Pick<TransactionEntryCreateInputInterface, 'amount' | 'categoryId'>>
): TransactionEntryCreateInputInterface => ({
    amount: 0,
    categoryId: 0,
    ...input
});
