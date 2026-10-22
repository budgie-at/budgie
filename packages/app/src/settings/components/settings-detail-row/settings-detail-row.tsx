import { UserIconType } from '@budgie/contracts';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { isDefined } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';

interface Props {
    readonly icon: UserIconType;
    readonly variant: ColorPaletteVariant;
    readonly title: string;
    readonly description: string;
    readonly right: ReactNode;
    readonly onPress?: () => void;
    readonly testID?: string;
}

export const SettingsDetailRow = ({ icon, variant, title, description, right, onPress, testID }: Props) => (
    <HapticPressable className="flex-row items-center gap-x-lg py-xl" onPress={onPress} disabled={!isDefined(onPress)} testID={testID}>
        <CircleIcon icon={icon} variant={variant} border={false} size={36} iconSize={18} />

        <View className="flex-1">
            <Text className="text-sm font-medium text-primary">{title}</Text>
            <Text className="text-xs text-secondary-foreground">{description}</Text>
        </View>

        {right}
    </HapticPressable>
);
