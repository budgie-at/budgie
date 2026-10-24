import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { MetaPillVariant } from '../../type/meta-pill-variant.type';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { UserIconType } from '@budgie/contracts';

interface Props {
    readonly label: string;
    readonly icon?: UserIconType;
    readonly onPress?: () => void;
    readonly testID?: string;
    readonly variant?: MetaPillVariant;
}

const PILL_ICON_SIZE = 12;
const ENTER_DURATION_MS = 200;
const baseClassName = 'flex-row max-w-full items-center gap-x-xs rounded-full border px-sm py-[2px]';
const containerClassNames: Record<MetaPillVariant, string> = {
    default: 'border-secondary-corner bg-secondary-background',
    warning: 'border-warning-corner bg-warning-background',
    destructive: 'border-destructive-corner bg-destructive-background',
    positive: 'border-positive-corner bg-positive-background'
};
const labelClassNames: Record<MetaPillVariant, string> = {
    default: 'text-secondary-foreground',
    warning: 'text-warning-foreground font-semibold',
    destructive: 'text-destructive-foreground font-semibold',
    positive: 'text-positive-foreground font-semibold'
};
const continuousBorder = { borderCurve: 'continuous' as const };

export const MetaPill = ({ label, icon, onPress, testID, variant = 'default' }: Props) => {
    const labelClassName = `text-xs ${labelClassNames[variant]}`;
    const body = (
        <View className={`${baseClassName} ${containerClassNames[variant]}`} style={continuousBorder}>
            {isDefined(icon) && <Icon icon={icon} size={PILL_ICON_SIZE} className={labelClassName} />}
            <Text className={`${labelClassName} shrink`} numberOfLines={1} ellipsizeMode="tail">
                {label}
            </Text>
        </View>
    );

    if (!isDefined(onPress)) {
        return (
            <View className="flex-row">
                <Animated.View entering={FadeIn.duration(ENTER_DURATION_MS)} testID={testID}>
                    {body}
                </Animated.View>
            </View>
        );
    }

    return (
        <View className="flex-row">
            <Animated.View entering={FadeIn.duration(ENTER_DURATION_MS)}>
                <HapticPressable accessibilityLabel={label} accessibilityRole="button" accessible onPress={onPress} testID={testID}>
                    {body}
                </HapticPressable>
            </Animated.View>
        </View>
    );
};
