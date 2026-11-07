import { ReactNode, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { isDefined } from '@rnw-community/shared';

import { EASE_OUT, MOTION_BASE_DURATION, MOTION_FADE_OUT } from '../../constant/motion.constant';
import { cn } from '../../utils/cn.util';

interface Props {
    readonly children: ReactNode;
    readonly isLoading: boolean;
    readonly className?: string;
    readonly containerClassName?: string;
    readonly loadingIndicator?: ReactNode;
}

const REVEAL_TIMING = { duration: MOTION_BASE_DURATION, easing: EASE_OUT };

export const LoadingContent = ({
    children,
    isLoading,
    className,
    containerClassName,
    loadingIndicator = <ActivityIndicator size="small" style={StyleSheet.absoluteFill} />
}: Props) => {
    const opacity = useSharedValue(isLoading ? 0 : 1);

    useEffect(() => {
        opacity.set(isLoading ? 0 : withTiming(1, REVEAL_TIMING));
    }, [isLoading, opacity]);

    const contentAnimatedStyle = useAnimatedStyle(() => ({ opacity: opacity.get() }));

    const contentPointerEvents = isLoading ? 'none' : 'auto';
    const contentImportantForAccessibility = isLoading ? 'no-hide-descendants' : 'auto';
    const accessibilityState = { busy: isLoading };

    return (
        <View accessibilityState={accessibilityState} className={containerClassName}>
            <Animated.View
                pointerEvents={contentPointerEvents}
                accessibilityElementsHidden={isLoading}
                importantForAccessibility={contentImportantForAccessibility}
                className={cn(className)}
                style={contentAnimatedStyle}
            >
                {children}
            </Animated.View>
            {isLoading && isDefined(loadingIndicator) ? (
                <Animated.View exiting={MOTION_FADE_OUT} style={StyleSheet.absoluteFill} pointerEvents="none">
                    {loadingIndicator}
                </Animated.View>
            ) : null}
        </View>
    );
};
