import { useLingui } from '@lingui/react/macro';
import { Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';

interface Props {
    readonly destinationAmount: number;
    readonly destinationSymbol: string;
    readonly sourceCode: string;
    readonly destinationCode: string;
    readonly exchangeRate: number;
    readonly isManualRate: boolean;
    readonly onPress?: () => void;
}

const ANIMATION_DELAY = 100;
const ANIMATION_DURATION = 200;
const RATE_DECIMALS = 4;

export const ConversionRow = (props: Props) => {
    const { destinationAmount, destinationSymbol, sourceCode, destinationCode, exchangeRate, isManualRate, onPress } = props;
    const { t } = useLingui();

    const prefix = isManualRate ? '=' : '\u2248';
    const formattedAmount = destinationAmount > 0 ? destinationAmount.toFixed(2) : '0.00';
    const formattedRate = exchangeRate > 0 ? exchangeRate.toFixed(RATE_DECIMALS) : '—';
    const rateLabel = t`1 ${sourceCode} = ${formattedRate} ${destinationCode}`;

    return (
        <Animated.View entering={FadeInUp.delay(ANIMATION_DELAY).duration(ANIMATION_DURATION)}>
            <HapticPressable
                className="flex-row items-center justify-between px-md py-sm bg-secondary-background rounded-2xl"
                onPress={onPress}
            >
                <Text className="text-lg font-semibold text-primary">
                    {prefix} {destinationSymbol} {formattedAmount}
                </Text>
                <View className="items-end">
                    <Text className="text-xs text-secondary-foreground">{rateLabel}</Text>
                </View>
            </HapticPressable>
        </Animated.View>
    );
};
