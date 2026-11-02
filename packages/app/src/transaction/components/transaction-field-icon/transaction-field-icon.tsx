import { UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { RefObject, useImperativeHandle } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
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

    const captionStyle = { height: 36 * useWindowDimensions().fontScale };
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
    const tileClassName = hasValue ? 'bg-surface-fill' : 'bg-transaction-detail-row';
    const glyphClassName = cn(hasValue ? 'text-primary' : 'text-secondary-foreground', isDisabled ? 'opacity-50' : 'opacity-100');
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
                            className={cn('h-[44px] w-[44px] items-center justify-center rounded-[14px]', tileClassName)}
                            style={CONTINUOUS_CORNERS}
                        >
                            <Icon className={glyphClassName} icon={icon} size={20} />
                        </View>
                        <Text
                            className="min-h-[36px] self-stretch text-center text-[13px] leading-[18px] text-primary"
                            style={captionStyle}
                            numberOfLines={2}
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
