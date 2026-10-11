import type { AiFeatureIdEnum } from '../../enum/ai-feature-id.enum';

export const AiModelStorageCardSelector = {
    Container: 'AiModelStorageCard',
    FreeUnusedButton: 'AiModelStorageCard.FreeUnusedButton',
    FeatureRow: (id: AiFeatureIdEnum) => `AiModelStorageCard.FeatureRow.${id}`,
    FeatureSwitch: (id: AiFeatureIdEnum) => `AiModelStorageCard.FeatureSwitch.${id}`,
    FeatureSwitchStateOn: (id: AiFeatureIdEnum) => `AiModelStorageCard.FeatureSwitch.${id}.State.On`,
    FeatureSwitchStateOff: (id: AiFeatureIdEnum) => `AiModelStorageCard.FeatureSwitch.${id}.State.Off`
};
