import { AccountEntityInterface } from '../../account/entity/account-entity-interface.type';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionWithRelationsEntityInterface } from './transaction-with-relations-entity-interface.type';

export interface TransactionNegativeAdjustmentWithRelationsEntityInterface extends Omit<
    TransactionWithRelationsEntityInterface,
    TransactionAssociationEnum.FROM_ACCOUNT | 'type'
> {
    [TransactionAssociationEnum.FROM_ACCOUNT]: AccountEntityInterface;
    type: TransactionTypeEnum.ADJUSTMENT;
}
