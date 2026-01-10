import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVibration } from '../../hook/use-vibration.hook';
import { Icon } from '../icon/icon';

import { AiActionButton } from './ai-action-button/ai-action-button';
import { useAnimatedActionMenu } from './animated-action-menu.context';

import type { PropsWithChildren } from 'react';

interface Props extends PropsWithChildren {
    readonly triggerIcon?: UserIconNameEnum;
}

const BACKDROP_OPACITY = 0.85;
const ANIMATION_DURATION = 200;
const ICON_SIZE = 24;
const BUTTON_ROTATION_ACTIVE = 45;
const CONTAINER_MARGIN_BOTTOM = 4;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };

export const AnimatedActionMenu = ({ children, triggerIcon = UserIconNameEnum.Plus }: Props) => {
    const { isOpen, close } = useAnimatedActionMenu();
    const [, hapticImpact] = useVibration();
    const { bottom } = useSafeAreaInsets();

    const opacity = useSharedValue(0);
    const rotation = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(isOpen ? BACKDROP_OPACITY : 0, { duration: ANIMATION_DURATION });
        rotation.value = withSpring(isOpen ? BUTTON_ROTATION_ACTIVE : 0, SPRING_CONFIG);
    }, [isOpen, opacity, rotation]);

    const backdropStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const buttonStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));

    const containerStyle = { paddingBottom: bottom, marginBottom: CONTAINER_MARGIN_BOTTOM };
    const pointerEvents = isOpen ? 'box-none' : 'none';

    const handleClose = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        close();
    };

    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(handleClose)();
    });

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents={pointerEvents}>
            <GestureDetector gesture={tapGesture}>
                <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
            </GestureDetector>

            {isOpen && (
                <>
                    <View className="absolute inset-x-0 bottom-0 items-center pb-lg" style={containerStyle} pointerEvents="box-none">
                        <AiActionButton />
                    </View>

                    <View className="absolute right-0 bottom-0 items-end px-lg pb-lg" style={containerStyle} pointerEvents="box-none">
                        <View className="items-end" pointerEvents="box-none">
                            {children}

                            <Pressable onPress={handleClose}>
                                <Animated.View
                                    className="bg-primary rounded-full items-center justify-center w-14 h-14"
                                    style={buttonStyle}
                                >
                                    <Icon className="text-primary-reverse" icon={triggerIcon} size={ICON_SIZE} />
                                </Animated.View>
                            </Pressable>
                        </View>
                    </View>
                </>
            )}
        </View>
    );
};
