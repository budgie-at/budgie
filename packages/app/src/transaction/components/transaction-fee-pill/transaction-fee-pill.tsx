import { t } from '@lingui/core/macro';
import { Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { useFormatDigits } from '../../../i18n/hook/use-format-digits.hook';
import { useSettingsContext } from '../../../settings/context/settings.context';

interface Props {
    readonly amount: number;
    readonly currencySymbol: string;
    readonly showEmptyState?: boolean;
    readonly onPress?: () => void;
    readonly testID?: string;
}

const ENTER_DURATION_MS = 200;
const baseClassName = 'flex-row items-center gap-x-xs rounded-full px-sm py-[2px] border border-secondary-corner bg-secondary-background';
const labelClassName = 'text-xs text-secondary-foreground';
const continuousBorder = { borderCurve: 'continuous' as const };

export const TransactionFeePill = ({ amount, currencySymbol, showEmptyState = false, onPress, testID }: Props) => {
    const { decimalPlaces } = useSettingsContext();
    const formatDigits = useFormatDigits(decimalPlaces);
    const hasFee = amount > 0;

    if (!hasFee && !showEmptyState) {
        return null;
    }

    const formattedAmount = formatDigits(amount, currencySymbol);
    const label = hasFee ? t`Fee ${formattedAmount}` : t`Set fee`;

    const body = (
        <View className={baseClassName} style={continuousBorder}>
            <Text className={labelClassName} numberOfLines={1} ellipsizeMode="tail">
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
