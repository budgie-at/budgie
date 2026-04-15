import { AccountWithInstrumentEntityInterface } from '../../account/entity/account-with-instrument-entity-interface.type';
import { CategoryEntityInterface } from '../../category/entity/category-entity-interface.type';
import { MccCategoryEntityInterface } from '../../mcc-category/entity/mcc-category-entity-interface.type';
import { TransactionEntryAssociationEnum } from '../enum/transaction-entry-association.enum';

import { TransactionEntryEntityInterface } from './transaction-entry-entity-interface.type';

export interface TransactionEntryWithRelationsEntityInterface extends TransactionEntryEntityInterface {
    [TransactionEntryAssociationEnum.ACCOUNT]: AccountWithInstrumentEntityInterface;
    [TransactionEntryAssociationEnum.CATEGORY]: CategoryEntityInterface | null;
    [TransactionEntryAssociationEnum.MCC_CATEGORY]: MccCategoryEntityInterface | null;
}
