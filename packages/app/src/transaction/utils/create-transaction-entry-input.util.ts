import { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateEntityInterface, 'type' | 'accountId' | 'instrumentId'>
): TransactionEntryCreateEntityInterface => ({
    ...input,
    amount: 0,
    categoryId: 0
});
