import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity.interface';
import { AccountAssociationEnum } from '../enum/account-association.enum';

import { AccountEntityInterface } from './account-entity.interface';

export interface AccountWithInstrumentEntityInterface extends AccountEntityInterface {
    [AccountAssociationEnum.INSTRUMENT]: InstrumentEntityInterface;
}
