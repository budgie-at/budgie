import { AI_FEATURE_SETTING_KEY } from '../constant/ai-feature-setting-key.constant';
import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

import type { AiFeatureSettingsInterface } from '../interface/ai-feature-settings.interface';

export const getEnabledAiFeatures = (settings: AiFeatureSettingsInterface): readonly AiFeatureIdEnum[] =>
    Object.values(AiFeatureIdEnum).filter(featureId => settings[AI_FEATURE_SETTING_KEY[featureId]]);
