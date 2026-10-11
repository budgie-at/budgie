import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

import type { AiFeatureSettingsInterface } from '../interface/ai-feature-settings.interface';

export const AI_FEATURE_SETTING_KEY = {
    [AiFeatureIdEnum.VOICE_INPUT]: 'isAiVoiceInputEnabled',
    [AiFeatureIdEnum.TRANSACTION_SUGGESTIONS]: 'isAiSuggestionsEnabled',
    [AiFeatureIdEnum.CATEGORY_TAG_TRANSLATIONS]: 'isAiTranslationsEnabled'
} as const satisfies Record<AiFeatureIdEnum, keyof AiFeatureSettingsInterface>;
