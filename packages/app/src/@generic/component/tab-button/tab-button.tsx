import { UserIconNameEnum } from '@budgie/contracts';
import { cva } from 'class-variance-authority';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { HapticPressFeedbackEnum } from '../../enum/haptic-press-feedback.enum';
import { useReducedMotion } from '../../hook/use-reduced-motion.hook';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import type { Href } from 'expo-router';
import type { TabTriggerSlotProps } from 'expo-router/ui';
import type { GestureResponderEvent } from 'react-native';

interface TabButtonProps extends Omit<TabTriggerSlotProps, 'href'> {
    readonly icon: UserIconNameEnum;
    readonly navigateTo?: Href;
    readonly testID: string;
}

const TAB_SIZE = 52;
const ICON_SIZE = 24;
const ICON_POP_START_SCALE = 0.82;
const ICON_POP_SPRING = { dampingRatio: 0.5, duration: 450 };

const tabVariants = cva('items-center justify-center rounded-full', {
    variants: {
        isFocused: {
            true: 'bg-primary',
            false: 'bg-primary/10'
        }
    }
});

const tabIconVariants = cva('', {
    variants: {
        isFocused: {
            true: 'text-primary-reverse',
            false: 'text-secondary-foreground'
        }
    }
});

export const TabButton = ({ children, isFocused = false, onPress, icon, navigateTo, style: _, testID, ...rest }: TabButtonProps) => {
    const isReducedMotion = useReducedMotion();
    const wasFocusedRef = useRef(isFocused);
    const iconScale = useSharedValue(1);

    useEffect(() => {
        if (isFocused && !wasFocusedRef.current && !isReducedMotion) {
            iconScale.set(ICON_POP_START_SCALE);
            iconScale.set(withSpring(1, ICON_POP_SPRING));
        }

        wasFocusedRef.current = isFocused;
    }, [isFocused, isReducedMotion, iconScale]);

    const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: iconScale.get() }] }));

    const handlePress = (event: GestureResponderEvent) => {
        if (navigateTo) {
            router.push(navigateTo);
        } else {
            onPress?.(event);
        }
    };

    const tabStyle = { width: TAB_SIZE, height: TAB_SIZE };

    return (
        <HapticPressable
            {...rest}
            accessibilityLabel={testID}
            accessibilityRole="button"
            accessible
            className="rounded-full bg-primary-reverse"
            collapsable={false}
            hitSlop={12}
            nativeID={testID}
            onPress={handlePress}
            pressFeedback={HapticPressFeedbackEnum.SELECTION}
            style={tabStyle}
            testID={testID}
        >
            <View collapsable={false} nativeID={testID} style={StyleSheet.absoluteFill} testID={testID} />
            <View className={tabVariants({ isFocused })} style={tabStyle}>
                <Animated.View style={iconStyle}>
                    <Icon className={tabIconVariants({ isFocused })} icon={icon} size={ICON_SIZE} />
                </Animated.View>
            </View>
        </HapticPressable>
    );
};
