import { AccountEntityInterface } from '../../account/entity/account-entity.interface';
import { TransactionEntryWithRelationsEntityInterface } from '../../transaction-entry/entity/transaction-entry-with-relations-entity.interface';
import { TransactionTagsWithTagEntityInterface } from '../../transaction-tags/entity/transaction-tags-with-tag-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransactionEntityInterface } from './transaction-entity.interface';

export interface TransactionWithRelationsEntityInterface extends TransactionEntityInterface {
    [TransactionAssociationEnum.ENTRIES]: TransactionEntryWithRelationsEntityInterface[];
    [TransactionAssociationEnum.FROM_ACCOUNT]: AccountEntityInterface | null;
    [TransactionAssociationEnum.TO_ACCOUNT]: AccountEntityInterface | null;
    [TransactionAssociationEnum.TRANSACTION_TAGS]: TransactionTagsWithTagEntityInterface[];
}
