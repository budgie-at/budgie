import { AiSubsystemNameEnum } from '../enum/ai-subsystem-name.enum';

import type { AiFeatureSettingsInterface } from '../interface/ai-feature-settings.interface';

export const getEnabledAiSubsystems = (settings: AiFeatureSettingsInterface): ReadonlySet<AiSubsystemNameEnum> =>
    new Set([
        ...(settings.isAiVoiceInputEnabled ? Object.values(AiSubsystemNameEnum) : []),
        ...(settings.isAiSuggestionsEnabled ? [AiSubsystemNameEnum.EMBEDDING] : []),
        ...(settings.isAiTranslationsEnabled ? [AiSubsystemNameEnum.CHAT] : [])
    ]);
