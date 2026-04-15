import { AccountEntityInterface } from '../../account/entity/account-entity-interface.type';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionWithRelationsEntityInterface } from './transaction-with-relations-entity-interface.type';

export interface TransactionIncomeWithRelationsEntityInterface extends Omit<
    TransactionWithRelationsEntityInterface,
    TransactionAssociationEnum.TO_ACCOUNT | 'type'
> {
    [TransactionAssociationEnum.TO_ACCOUNT]: AccountEntityInterface;
    type: TransactionTypeEnum.INCOME;
}
