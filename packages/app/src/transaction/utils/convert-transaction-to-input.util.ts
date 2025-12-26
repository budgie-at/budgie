import {
    TransactionCreateInputInterface,
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';

const calculateAmount = (transaction: TransactionWithRelationsEntityInterface) => {
    if (
        transaction.type === TransactionTypeEnum.EXPENSE ||
        transaction.type === TransactionTypeEnum.TRANSFER ||
        isNegativeAdjustmentTransaction(transaction)
    ) {
        return transaction.entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.DEBIT ? acc + curr.amount : acc), 0);
    }

    if (transaction.type === TransactionTypeEnum.INCOME || isPositiveAdjustmentTransaction(transaction)) {
        return transaction.entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.CREDIT ? acc + curr.amount : acc), 0);
    }

    return 0;
};

export const convertTransactionToInput = (transaction: TransactionWithRelationsEntityInterface): TransactionCreateInputInterface => ({
    ...transaction,
    amount: calculateAmount(transaction),
    tagIds: transaction.transactionTags.map(({ tagId }) => tagId),
    entries: transaction.entries.map(entry => ({
        ...entry,
        amount: convertFromMicroUnits(entry.amount)
    }))
});
