import { TransactionEntryEntityInterface } from '../../transaction-entry/entity/transaction-entry-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransactionEntityInterface } from './transaction-entity.interface';

export interface TransactionWithRelationsEntityInterface extends TransactionEntityInterface {
    [TransactionAssociationEnum.ENTRIES]: TransactionEntryEntityInterface[];
}
