import { TransactionCreateEntityInterface, TransactionWithRelationsEntityInterface, convertFromMicroUnits } from '@budgie/contracts';

export const convertTransactionToInput = (transaction: TransactionWithRelationsEntityInterface): TransactionCreateEntityInterface => ({
    ...transaction,
    amount: convertFromMicroUnits(transaction.amount),
    tagIds: transaction.transactionTags.map(({ tagId }) => tagId),
    entries: transaction.entries.map(entry => ({
        ...entry,
        amount: convertFromMicroUnits(entry.amount)
    }))
});
