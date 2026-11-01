import { UserIconType } from '@budgie/contracts';
import { t } from '@lingui/core/macro';
import { RefObject, useImperativeHandle } from 'react';
import { Text, View } from 'react-native';
import Animated, { FadeInUp, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

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
    readonly testID?: string;
}

const PRESSED_SCALE = 0.95;
const CONTINUOUS_CORNERS = { borderCurve: 'continuous' } as const;

export const TransactionFieldIcon = (props: Props) => {
    const { ref, icon, label, value, onPress, animationDelay = 0, testID } = props;

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
    const tileClassName = hasValue ? 'bg-surface-disc' : 'bg-transaction-detail-row';
    const glyphClassName = hasValue ? 'text-primary' : 'text-secondary-foreground';
    const accessibilityLabel = `${label}: ${value ?? t`not set`}`;

    return (
        <Animated.View entering={FadeInUp.delay(animationDelay).duration(200)} className="flex-1">
            <Animated.View style={shakeStyle}>
                <Animated.View style={pressedStyle}>
                    <HapticPressable
                        className="items-center gap-sm px-xxs"
                        onPress={onPress}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        accessibilityLabel={accessibilityLabel}
                        accessibilityRole="button"
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
                        <View className="h-[34px] items-center self-stretch">
                            <Text className="text-[12px] leading-[16px] text-secondary-foreground" numberOfLines={1}>
                                {label}
                            </Text>
                            <Text
                                className="self-stretch text-center text-[13px] leading-[18px] font-medium text-primary"
                                numberOfLines={1}
                                {...testIDProps(testID, TestIDPartEnum.TITLE)}
                            >
                                {hasValue ? value : ''}
                            </Text>
                        </View>
                    </HapticPressable>
                </Animated.View>
            </Animated.View>
        </Animated.View>
    );
};
