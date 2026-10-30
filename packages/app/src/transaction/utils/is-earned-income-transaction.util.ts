import {
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface,
    isNegativeAdjustmentTransaction,
    isPositiveAdjustmentTransaction
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { getTransactionType } from './get-transaction-type.util';

export const isEarnedIncomeTransaction = (transaction: TransactionWithRelationsEntityInterface): boolean =>
    getTransactionType(transaction) === TransactionTypeEnum.INCOME &&
    !isPositiveAdjustmentTransaction(transaction) &&
    !isNegativeAdjustmentTransaction(transaction) &&
    !isDefined(transaction.debtEvents.at(0));
