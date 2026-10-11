import { AI_FEATURE_SETTING_KEY } from '../constant/ai-feature-setting-key.constant';
import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

import type { AiFeatureSettingsInterface } from '../interface/ai-feature-settings.interface';

export const getAiFeatureSettingsAfterChange = (
    settings: AiFeatureSettingsInterface,
    featureId: AiFeatureIdEnum,
    isEnabled: boolean
): AiFeatureSettingsInterface => ({ ...settings, [AI_FEATURE_SETTING_KEY[featureId]]: isEnabled });
