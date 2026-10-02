import { Db, SettingsCreateEntityInterface, SettingsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

export const updateSettingsMutation = (input: Partial<SettingsCreateEntityInterface>) =>
    Db.transaction(Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.update(input)));
