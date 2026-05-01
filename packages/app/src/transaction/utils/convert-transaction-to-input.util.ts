import {
    TransactionEntryTypeEnum,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { RuleEvaluationInputInterface } from '../../rule/interface/rule-evaluation-input.interface';

import { sortTransactionTagsByPrimary } from './sort-transaction-tags-by-primary.util';

const calculateAmount = (transaction: TransactionWithRelationsEntityInterface) => {
    if (
        transaction.type === TransactionTypeEnum.EXPENSE ||
        transaction.type === TransactionTypeEnum.TRANSFER ||
        transaction.type === TransactionTypeEnum.DEBT ||
        isNegativeAdjustmentTransaction(transaction)
    ) {
        return transaction.entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.CREDIT ? acc + curr.amount : acc), 0);
    }

    if (transaction.type === TransactionTypeEnum.INCOME || isPositiveAdjustmentTransaction(transaction)) {
        return transaction.entries.reduce((acc, curr) => (curr.type === TransactionEntryTypeEnum.DEBIT ? acc + curr.amount : acc), 0);
    }

    return 0;
};

export const convertTransactionToInput = (transaction: TransactionWithRelationsEntityInterface): RuleEvaluationInputInterface => ({
    ...transaction,
    amount: convertFromMicroUnits(calculateAmount(transaction)),
    tagIds: sortTransactionTagsByPrimary(transaction.transactionTags).map(({ tagId }) => tagId),
    entries: transaction.entries.map(entry => ({
        ...entry,
        amount: convertFromMicroUnits(entry.amount),
        mccCode: entry.mccCategory?.mcc ?? null
    }))
});
