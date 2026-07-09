import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

import type { UserIconNameEnum } from '@budgie/contracts';

interface Props {
    readonly label: string;
    readonly icon?: UserIconNameEnum;
    readonly onPress?: () => void;
    readonly testID?: string;
    readonly variant?: 'default' | 'warning';
}

const PILL_ICON_SIZE = 12;
const ENTER_DURATION_MS = 200;
const baseClassName = 'flex-row max-w-full items-center gap-x-xs rounded-full border px-sm py-[2px]';
const defaultContainerClassName = 'border-secondary-corner bg-secondary-background';
const defaultLabelClassName = 'text-secondary-foreground';
const warningContainerClassName = 'border-warning-corner bg-warning-background';
const warningLabelClassName = 'text-warning-foreground font-semibold';
const continuousBorder = { borderCurve: 'continuous' as const };

export const TransactionMetaPill = ({ label, icon, onPress, testID, variant = 'default' }: Props) => {
    const containerClassName = variant === 'warning' ? warningContainerClassName : defaultContainerClassName;
    const labelVariantClassName = variant === 'warning' ? warningLabelClassName : defaultLabelClassName;
    const labelClassName = `text-xs ${labelVariantClassName}`;
    const body = (
        <View className={`${baseClassName} ${containerClassName}`} style={continuousBorder}>
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
