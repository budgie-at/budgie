import { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import { TransactionWithRelationsEntityInterface } from './transaction-with-relations-entity.interface';

export interface TransactionIncomeWithRelationsEntityInterface extends Omit<
    TransactionWithRelationsEntityInterface,
    TransactionAssociationEnum.TO_ACCOUNT | 'type'
> {
    [TransactionAssociationEnum.TO_ACCOUNT]: AccountEntityInterface;
    type: TransactionTypeEnum.INCOME;
}
