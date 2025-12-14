import { isDefined } from '@rnw-community/shared';

import { TransactionNegativeAdjustmentWithRelationsEntityInterface } from '../entity/transaction-negative-adjustment-with-relations-entity.interface';
import { TransactionWithRelationsEntityInterface } from '../entity/transaction-with-relations-entity.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const isNegativeAdjustmentTransaction = (
    transaction: TransactionWithRelationsEntityInterface
): transaction is TransactionNegativeAdjustmentWithRelationsEntityInterface =>
    transaction.type === TransactionTypeEnum.ADJUSTMENT && isDefined(transaction.fromAccount);
