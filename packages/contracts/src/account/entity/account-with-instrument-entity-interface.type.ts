import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity-interface.type';
import { AccountAssociationEnum } from '../enum/account-association.enum';

import { AccountEntityInterface } from './account-entity-interface.type';

export interface AccountWithInstrumentEntityInterface extends AccountEntityInterface {
    [AccountAssociationEnum.INSTRUMENT]: InstrumentEntityInterface;
}
