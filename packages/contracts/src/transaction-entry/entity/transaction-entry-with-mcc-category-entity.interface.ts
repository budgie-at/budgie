import { MccCategoryEntityInterface } from '../../mcc-category/entity/mcc-category-entity.interface';
import { TransactionEntryAssociationEnum } from '../enum/transaction-entry-association.enum';

import { TransactionEntryEntityInterface } from './transaction-entry-entity.interface';

export interface TransactionEntryWithMccCategoryEntityInterface extends TransactionEntryEntityInterface {
    readonly [TransactionEntryAssociationEnum.MCC_CATEGORY]: MccCategoryEntityInterface | null;
}
