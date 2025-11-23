import { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import { CategoryEntityInterface } from '../../category/entity/category-entity.interface';
import { TransactionEntryAssociationEnum } from '../enum/transaction-entry-association.enum';

import { TransactionEntryEntityInterface } from './transaction-entry-entity.interface';

export interface TransactionEntryWithRelationsEntityInterface extends TransactionEntryEntityInterface {
    [TransactionEntryAssociationEnum.ACCOUNT]: AccountEntityInterface;
    [TransactionEntryAssociationEnum.CATEGORY]: CategoryEntityInterface;
}
