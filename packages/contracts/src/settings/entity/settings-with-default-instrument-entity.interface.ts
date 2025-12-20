import { InstrumentEntityInterface } from '../../instrument/entity/instrument-entity.interface';
import { SettingsAssociationEnum } from '../enum/settings-association.enum';

import { SettingsEntityInterface } from './settings-entity.interface';

export interface SettingsWithDefaultInstrumentEntityInterface extends SettingsEntityInterface {
    [SettingsAssociationEnum.DEFAULT_INSTRUMENT]: InstrumentEntityInterface;
}
