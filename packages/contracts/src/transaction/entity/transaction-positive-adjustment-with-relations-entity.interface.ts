import { AccountWithInstrumentEntityInterface } from '../../account/entity/account-with-instrument-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionWithRelationsEntityInterface } from './transaction-with-relations-entity.interface';

export interface TransactionPositiveAdjustmentWithRelationsEntityInterface extends Omit<
    TransactionWithRelationsEntityInterface,
    TransactionAssociationEnum.TO_ACCOUNT | 'type'
> {
    [TransactionAssociationEnum.TO_ACCOUNT]: AccountWithInstrumentEntityInterface;
    type: TransactionTypeEnum.ADJUSTMENT;
}
