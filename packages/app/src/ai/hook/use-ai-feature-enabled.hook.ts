import { useSetting } from '../../settings/hook/use-setting.hook';
import { AI_FEATURE_SETTING_KEY } from '../constant/ai-feature-setting-key.constant';
import { AiFeatureIdEnum } from '../enum/ai-feature-id.enum';

export const useAiFeatureEnabled = (featureId: AiFeatureIdEnum): boolean => useSetting(AI_FEATURE_SETTING_KEY[featureId]);
