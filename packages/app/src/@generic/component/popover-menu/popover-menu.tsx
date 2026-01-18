import { ReactNode, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, ViewStyle, useWindowDimensions } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedReaction, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

const BACKDROP_OPACITY = 0.3;
const MENU_SCALE_CLOSED = 0.95;
const ANIMATION_DURATION = 150;
const MENU_MARGIN = 16;
const DEFAULT_MENU_TOP = 64;
const ANCHOR_OFFSET = 8;

const TIMING_CONFIG = { duration: ANIMATION_DURATION, easing: Easing.out(Easing.cubic) };

export interface PopoverMenuAnchor {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

interface Props {
    readonly isOpen: boolean;
    readonly onClose: EmptyFn;
    readonly children: ReactNode;
    readonly anchor?: PopoverMenuAnchor;
}

const usePopoverAnimation = (isOpen: boolean) => {
    const [isAnimatingOut, setIsAnimatingOut] = useState(false);
    const isMountedRef = useRef(true);

    const isOpenShared = useSharedValue(isOpen);
    const backdropOpacity = useSharedValue(isOpen ? BACKDROP_OPACITY : 0);
    const menuScale = useSharedValue(isOpen ? 1 : MENU_SCALE_CLOSED);
    const menuOpacity = useSharedValue(isOpen ? 1 : 0);

    useEffect(() => {
        isMountedRef.current = true;

        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        isOpenShared.value = isOpen;
    }, [isOpen, isOpenShared]);

    const safeSetIsAnimatingOut = (value: boolean) => {
        if (isMountedRef.current) {
            setIsAnimatingOut(value);
        }
    };

    useAnimatedReaction(
        () => isOpenShared.value,
        (current, previous) => {
            if (current && !previous) {
                backdropOpacity.value = withTiming(BACKDROP_OPACITY, TIMING_CONFIG);
                menuScale.value = withTiming(1, TIMING_CONFIG);
                menuOpacity.value = withTiming(1, TIMING_CONFIG);
            } else if (!current && previous) {
                runOnJS(safeSetIsAnimatingOut)(true);
                backdropOpacity.value = withTiming(0, TIMING_CONFIG);
                menuScale.value = withTiming(MENU_SCALE_CLOSED, TIMING_CONFIG);
                menuOpacity.value = withTiming(0, TIMING_CONFIG, finished => {
                    if (finished) {
                        runOnJS(safeSetIsAnimatingOut)(false);
                    }
                });
            }
        },
        [isOpen]
    );

    const backdropStyle = useAnimatedStyle(() => ({ opacity: backdropOpacity.value }));
    const menuStyle = useAnimatedStyle(() => ({ opacity: menuOpacity.value, transform: [{ scale: menuScale.value }] }));

    return { isAnimatingOut, backdropStyle, menuStyle };
};

export const PopoverMenu = ({ isOpen, onClose, children, anchor }: Props) => {
    const { width: screenWidth } = useWindowDimensions();
    const { isAnimatingOut, backdropStyle, menuStyle } = usePopoverAnimation(isOpen);

    const menuTop = anchor ? anchor.y + anchor.height + ANCHOR_OFFSET : DEFAULT_MENU_TOP;
    const menuRight = anchor ? screenWidth - anchor.x - anchor.width : MENU_MARGIN;

    const menuContainerStyle: ViewStyle = { position: 'absolute', top: menuTop, right: menuRight };

    const shouldRender = isOpen || isAnimatingOut;

    if (!shouldRender) {
        return null;
    }

    return (
        <Modal transparent visible={shouldRender} animationType="none" onRequestClose={onClose}>
            <View className="flex-1">
                <Pressable onPress={onClose} style={StyleSheet.absoluteFill}>
                    <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
                </Pressable>

                <View style={menuContainerStyle}>
                    <Animated.View
                        className="min-w-[220px] overflow-hidden rounded-2xl border border-secondary-corner bg-primary-reverse shadow-lg"
                        style={menuStyle}
                    >
                        {children}
                    </Animated.View>
                </View>
            </View>
        </Modal>
    );
};
