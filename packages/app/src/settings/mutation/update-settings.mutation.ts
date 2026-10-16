import { Db, SettingsCreateEntityInterface, SettingsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import type { AiFeatureSettingsInterface } from '../../ai/interface/ai-feature-settings.interface';

export const updateSettingsMutation = (input: Partial<SettingsCreateEntityInterface>) =>
    Db.transaction(Effect.flatMap(SettingsRepository, settingsRepository => settingsRepository.update(input)));

export const updateAiFeatureMutation = (settingKey: keyof AiFeatureSettingsInterface, enabled: boolean) =>
    Db.transaction(
        Effect.gen(function* () {
            const repository = yield* SettingsRepository;
            const settings = yield* repository.getSettings();
            const features = {
                isAiVoiceInputEnabled: settings.isAiVoiceInputEnabled,
                isAiSuggestionsEnabled: settings.isAiSuggestionsEnabled,
                isAiTranslationsEnabled: settings.isAiTranslationsEnabled,
                [settingKey]: enabled
            };

            return yield* repository.update({ [settingKey]: enabled, isAiEnabled: Object.values(features).some(Boolean) });
        })
    );
