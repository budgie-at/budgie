import { UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { RefObject, useImperativeHandle } from 'react';
import { View } from 'react-native';
import Animated, { ReduceMotion, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { TransactionFieldCaption } from '../transaction-field-caption/transaction-field-caption';

export interface TransactionFieldIconRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconRef | null>;
    readonly icon: UserIconType;
    readonly label: string;
    readonly value?: string;
    readonly onPress: () => void;
    readonly accessibilityValue?: string;
    readonly disabledHint?: string;
    readonly testID?: string;
}

const PRESSED_SCALE = 0.95;
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, onPress, accessibilityValue, disabledHint, testID } = props;

    const pressed = useSharedValue(false);
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const pressedStyle = useAnimatedStyle(() => ({
        transform: [
            { scale: withSpring(pressed.value ? PRESSED_SCALE : 1, { damping: 15, stiffness: 300, reduceMotion: ReduceMotion.System }) }
        ]
    }));

    const handlePressIn = () => {
        pressed.set(true);
    };

    const handlePressOut = () => {
        pressed.set(false);
    };

    const hasValue = isNotEmptyString(value);
    const isDisabled = isNotEmptyString(disabledHint);
    const tileClassName = hasValue
        ? 'border-transparent bg-primary/10'
        : 'border-surface-separator bg-transaction-detail-row dark:border-transparent';
    const tileOpacity = isDisabled ? 'opacity-40' : 'opacity-100';
    const glyphClassName = hasValue ? 'text-primary' : 'text-secondary-foreground';
    const accessibilityLabel = `${label}: ${accessibilityValue ?? value ?? t`not set`}`;
    const accessibilityState = { disabled: isDisabled };

    return (
        <Animated.View entering={FadeInUp.delay(100).duration(200).reduceMotion(ReduceMotion.System)} className="w-1/5">
            <Animated.View style={shakeStyle}>
                <Animated.View style={pressedStyle}>
                    <HapticPressable
                        className="items-center gap-xs px-xxs"
                        disabled={isDisabled}
                        onPress={onPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        accessibilityLabel={accessibilityLabel}
                        accessibilityHint={disabledHint}
                        accessibilityRole="button"
                        accessibilityState={accessibilityState}
                        accessible
                        collapsable={false}
                        nativeID={testID}
                        testID={testID}
                    >
                        <View
                            className={cn(
                                'h-[44px] w-[44px] items-center justify-center rounded-[14px] border-hairline',
                                tileClassName,
                                tileOpacity
                            )}
                            style={CONTINUOUS_CORNERS}
                        >
                            <Icon className={glyphClassName} icon={icon} size={20} />
                            {hasValue ? (
                                <View className="absolute top-[5px] right-[5px] h-[9px] w-[9px] items-center justify-center rounded-full bg-surface">
                                    <View className="h-[5px] w-[5px] rounded-full bg-primary" />
                                </View>
                            ) : null}
                        </View>
                        <TransactionFieldCaption label={label} value={value} testID={testID} />
                    </HapticPressable>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};
