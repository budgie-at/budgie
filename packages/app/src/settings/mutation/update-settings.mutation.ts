import { SettingsCreateEntityInterface, SettingsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

export const updateSettingsMutation = (input: Partial<SettingsCreateEntityInterface>) =>
    Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.update(input));
