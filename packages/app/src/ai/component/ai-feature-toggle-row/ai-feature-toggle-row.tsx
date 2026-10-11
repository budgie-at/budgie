import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { ActivityIndicator, Text, View } from 'react-native';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';
import { SettingSwitch } from '../../../settings/components/setting-switch/setting-switch';
import { formatModelStorageSize } from '../../utils/format-model-storage-size.util';
import { AiModelStorageCardSelector } from '../ai-model-storage-card/ai-model-storage-card.selector';

import type { AiFeatureStorageInterface } from '../../interface/ai-feature-storage.interface';

interface Props {
    readonly feature: AiFeatureStorageInterface;
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly description: string;
    readonly isUpdating: boolean;
    readonly disabled?: boolean;
    readonly onValueChange: (feature: AiFeatureStorageInterface) => void;
}

export const AiFeatureToggleRow = ({ feature, icon, title, description, isUpdating, disabled = false, onValueChange }: Props) => {
    const { t } = useLingui();
    const iconVariant = feature.isEnabled ? 'positive' : 'secondary';
    const handleValueChange = (): void => {
        onValueChange(feature);
    };

    const switchSlot = isUpdating ? (
        <ActivityIndicator size="small" />
    ) : (
        <SettingSwitch
            value={feature.isEnabled}
            onValueChange={handleValueChange}
            disabled={disabled}
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
