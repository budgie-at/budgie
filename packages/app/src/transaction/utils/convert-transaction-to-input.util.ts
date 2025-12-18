import { TransactionCreateEntityInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

export const convertTransactionToInput = (transaction: TransactionWithRelationsEntityInterface): TransactionCreateEntityInterface => ({
    ...transaction,
    amount: convertFromMicroUnits(transaction.amount),
    tagIds: transaction.transactionTags.map(({ tagId }) => tagId),
    entries: transaction.entries.map(entry => ({
        ...entry,
        amount: convertFromMicroUnits(entry.amount)
    }))
});
