import { TransactionWithRelationsEntityInterface, convertFromMicroUnits } from '@budgie/contracts';

import { TransactionCreateInputInterface } from '../schema/transaction-create-input.schema';

export const convertTransactionToInput = (transaction: TransactionWithRelationsEntityInterface): TransactionCreateInputInterface => ({
    ...transaction,
    amount: convertFromMicroUnits(transaction.amount),
    exchangeRate: convertFromMicroUnits(transaction.exchangeRate),
    tagIds: transaction.transactionTags.map(({ tagId }) => tagId),
    entries: transaction.entries.map(entry => ({
        ...entry,
        amount: convertFromMicroUnits(entry.amount)
    }))
});
