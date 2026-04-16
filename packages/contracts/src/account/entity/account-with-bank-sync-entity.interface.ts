import { BankSyncEntityInterface } from '../../bank-sync/entity/bank-sync-entity.interface';
import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';

import { AccountEntityInterface } from './account-entity.interface';

export interface AccountWithBankSyncEntityInterface extends AccountEntityInterface {
    [AccountAssociationEnum.INSTRUMENT]: InstrumentEntityInterface;
    [AccountAssociationEnum.BANK_SYNC]: BankSyncEntityInterface | null;
}
