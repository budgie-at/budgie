import { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateEntityInterface, 'type' | 'accountId'> &
        Partial<Pick<TransactionEntryCreateEntityInterface, 'amount' | 'categoryId'>>
): Omit<TransactionEntryCreateEntityInterface, 'transactionId'> => ({
    type: input.type,
    accountId: input.accountId,
    amount: input.amount ?? 0,
    categoryId: input.categoryId ?? null,
    mccCategoryId: null,
    externalId: null
});
