import { UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { RefObject, useImperativeHandle } from 'react';
import { Text, View } from 'react-native';
import Animated, { ReduceMotion, FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isNotEmptyString } from '@rnw-community/shared';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { TestIDPartEnum } from '../../../@generic/enum/test-id-part.enum';
import { useShakeAnimation } from '../../../@generic/hook/use-shake-animation.hook';
import { cn } from '../../../@generic/utils/cn.util';
import { testID as testIDProps } from '../../../@generic/utils/test-id.util';

export interface TransactionFieldIconRef {
    shake: () => void;
}

interface Props {
    readonly ref?: RefObject<TransactionFieldIconRef | null>;
    readonly icon: UserIconType;
    readonly label: string;
    readonly value?: string;
    readonly onPress: () => void;
    readonly animationDelay?: number;
    readonly disabledHint?: string;
    readonly testID?: string;
}

const PRESSED_SCALE = 0.95;
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, onPress, animationDelay = 0, disabledHint, testID } = props;

    const pressed = useSharedValue(false);
    const { shake, animatedStyle: shakeStyle } = useShakeAnimation();

    useImperativeHandle(ref, () => ({ shake }));

    const pressedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: withSpring(pressed.value ? PRESSED_SCALE : 1, { damping: 15, stiffness: 300 }) }]
    }));

    const handlePressIn = () => {
        pressed.set(true);
    };

    const handlePressOut = () => {
        pressed.set(false);
    };

    const hasValue = isNotEmptyString(value);
    const isDisabled = isNotEmptyString(disabledHint);
    const tileClassName = hasValue ? 'border-[1.5px] border-primary' : 'border-hairline border-surface-separator';
    const glyphClassName = hasValue ? 'text-primary' : 'text-secondary-foreground';
    const glyphOpacityClassName = isDisabled ? 'opacity-50' : 'opacity-100';
    const accessibilityLabel = `${label}: ${value ?? t`not set`}`;
    const accessibilityState = { disabled: isDisabled };

    return (
        <Animated.View entering={FadeInUp.delay(animationDelay).duration(200).reduceMotion(ReduceMotion.System)} className="w-1/5">
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
                                'h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-transaction-detail-row',
                                tileClassName
                            )}
                            style={CONTINUOUS_CORNERS}
                        >
                            <Icon className={cn(glyphClassName, glyphOpacityClassName)} icon={icon} size={20} />
                            {hasValue ? <View className="absolute top-[4px] right-[4px] size-[6px] rounded-full bg-primary" /> : null}
                        </View>
                        <Text
                            className="min-h-[18px] self-stretch text-center text-[13px] leading-[18px] text-primary"
                            numberOfLines={1}
                            ellipsizeMode="tail"
                            {...testIDProps(testID, TestIDPartEnum.TITLE)}
                        >
                            {value ?? label}
                        </Text>
                    </HapticPressable>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};
