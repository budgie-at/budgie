import type { BaseEntityKeyType } from '../../@generic/type/base-entity-key.type';
import type { SettingsEntityInterface } from './settings-entity.interface';

export type SettingsCreateEntityInterface = Omit<SettingsEntityInterface, BaseEntityKeyType>;
