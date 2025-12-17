import { TransactionEntryCreateEntityInterface } from '@budgie/contracts';

export const createTransactionEntryInput = (
    input: Pick<TransactionEntryCreateEntityInterface, 'type' | 'instrumentId'> & { accountId: number | null }
): Omit<TransactionEntryCreateEntityInterface, 'transactionId' | 'accountId'> & { accountId: number | null } => ({
    ...input,
    amount: 0,
    categoryId: 0
});
