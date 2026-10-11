import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { AiFeatureIdEnum } from '../../enum/ai-feature-id.enum';
import { formatModelStorageSize } from '../../utils/format-model-storage-size.util';
import { AiModelStorageCardSelector } from '../ai-model-storage-card/ai-model-storage-card.selector';

import type { AiFeatureStorageInterface } from '../../interface/ai-feature-storage.interface';

interface Props {
    readonly feature: AiFeatureStorageInterface;
    readonly isAiAvailable: boolean;
    readonly updatingFeatureId: AiFeatureIdEnum | null;
    readonly isMutating: boolean;
    readonly onValueChange: (feature: AiFeatureStorageInterface, title: string) => void;
}

export const AiFeatureToggleRow = ({ feature, isAiAvailable, updatingFeatureId, isMutating, onValueChange }: Props) => {
    const { t } = useLingui();
    const featureContent = {
        [AiFeatureIdEnum.VOICE_INPUT]: {
            title: t`Add transactions by voice`,
            description: t`Speak an expense and Budgie fills in the transaction.`,
            icon: UserIconNameEnum.Mic
        },
        [AiFeatureIdEnum.TRANSACTION_SUGGESTIONS]: {
            title: t`Suggest transaction details`,
            description: t`Get category, tag, and note suggestions from your history.`,
            icon: UserIconNameEnum.Sparkles
        },
        [AiFeatureIdEnum.CATEGORY_TAG_TRANSLATIONS]: {
            title: t`Translate categories and tags`,
            description: t`Generate English names and search keywords automatically.`,
            icon: UserIconNameEnum.Languages
        }
    };
    const { title, description, icon } = featureContent[feature.id];
    const isEnabled = isAiAvailable && feature.isEnabled;
    const iconVariant = isEnabled ? 'positive' : 'secondary';
    const isUpdating = updatingFeatureId === feature.id;
    const isDisabled = !isAiAvailable || isMutating;
    const handleValueChange = (): void => {
        onValueChange(feature, title);
    };

    const switchSlot = isUpdating ? (
        <ActivityIndicator size="small" />
    ) : (
        <SettingSwitch
            value={isEnabled}
            onValueChange={handleValueChange}
            disabled={isDisabled}
            testID={AiModelStorageCardSelector.FeatureSwitch(feature.id)}
            stateOnTestID={AiModelStorageCardSelector.FeatureSwitchStateOn(feature.id)}
            stateOffTestID={AiModelStorageCardSelector.FeatureSwitchStateOff(feature.id)}
        />
    );
    const storageText = formatModelStorageSize(feature.requiredBytes);
    const storageDescription = t`Downloads on this device: ${storageText}`;

    return (
        <View
            className="flex-row items-center gap-x-2xl rounded-4xl border border-secondary-corner bg-secondary-background p-3xl"
            {...testIDProps(AiModelStorageCardSelector.FeatureRow(feature.id))}
        >
            <CircleIcon icon={icon} variant={iconVariant} border={false} size={36} iconSize={18} />

            <View className="flex-1 gap-y-xs">
                <Text className="text-primary text-sm font-semibold">{title}</Text>
                <Text className="text-secondary-foreground text-xs">{description}</Text>
                <Text className="text-secondary-foreground text-xs">{storageDescription}</Text>
            </View>

            {switchSlot}
        </View>
    );
};
