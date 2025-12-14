import { isDefined } from '@rnw-community/shared';

import { TransactionPositiveAdjustmentWithRelationsEntityInterface } from '../entity/transaction-positive-adjustment-with-relations-entity.interface';
import { TransactionWithRelationsEntityInterface } from '../entity/transaction-with-relations-entity.interface';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const isPositiveAdjustmentTransaction = (
    transaction: TransactionWithRelationsEntityInterface
): transaction is TransactionPositiveAdjustmentWithRelationsEntityInterface =>
    transaction.type === TransactionTypeEnum.ADJUSTMENT && isDefined(transaction.toAccount);
