import { TransactionEntryWithMccCategoryEntityInterface } from '../../transaction-entry/entity/transaction-entry-with-mcc-category-entity.interface';
import { TransactionAssociationEnum } from '../enum/transaction-association.enum';

import { TransactionEntityInterface } from './transaction-entity.interface';

export interface TransactionWithEntriesMccCategoryEntityInterface extends TransactionEntityInterface {
    readonly [TransactionAssociationEnum.ENTRIES]: TransactionEntryWithMccCategoryEntityInterface[];
}
