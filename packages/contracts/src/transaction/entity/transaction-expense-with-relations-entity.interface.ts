import { AccountWithInstrumentEntityInterface } from '../../account/entity/account-with-instrument-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionWithRelationsEntityInterface } from './transaction-with-relations-entity.interface';

export interface TransactionExpenseWithRelationsEntityInterface extends Omit<
    TransactionWithRelationsEntityInterface,
    TransactionAssociationEnum.FROM_ACCOUNT | 'type'
> {
    [TransactionAssociationEnum.FROM_ACCOUNT]: AccountWithInstrumentEntityInterface;
    type: TransactionTypeEnum.EXPENSE;
}
