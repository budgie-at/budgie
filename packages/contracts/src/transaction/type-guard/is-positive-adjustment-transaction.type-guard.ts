import { isDefined } from '@rnw-community/shared';

import { TransactionPositiveAdjustmentWithRelationsEntityInterface } from '../entity/transaction-positive-adjustment-with-relations-entity-interface.type';
import { TransactionWithRelationsEntityInterface } from '../entity/transaction-with-relations-entity-interface.type';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

export const isPositiveAdjustmentTransaction = (
    transaction: TransactionWithRelationsEntityInterface
): transaction is TransactionPositiveAdjustmentWithRelationsEntityInterface =>
    transaction.type === TransactionTypeEnum.ADJUSTMENT && isDefined(transaction.toAccount);
