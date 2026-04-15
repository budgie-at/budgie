import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity-interface.type';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';

import { SettingsEntityInterface } from './settings-entity-interface.type';

export interface SettingsWithDefaultInstrumentEntityInterface extends SettingsEntityInterface {
    [SettingsAssociationEnum.DEFAULT_INSTRUMENT]: InstrumentEntityInterface;
}
