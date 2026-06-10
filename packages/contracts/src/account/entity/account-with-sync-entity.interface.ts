import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity.interface';
import { SyncEntityInterface } from '../../sync/entity/sync-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';

import { AccountEntityInterface } from './account-entity.interface';

export interface AccountWithSyncEntityInterface extends AccountEntityInterface {
    [AccountAssociationEnum.INSTRUMENT]: InstrumentEntityInterface;
    [AccountAssociationEnum.BANK_SYNC]: SyncEntityInterface | null;
}
