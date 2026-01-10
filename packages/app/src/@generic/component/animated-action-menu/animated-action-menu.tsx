import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVibration } from '../../hook/use-vibration.hook';
import { HapticPressable } from '../haptic-pressable/haptic-pressable';
import { Icon } from '../icon/icon';

import { AnimatedActionItem } from './animated-action-item';

import type { AnimatedActionItemInterface } from './animated-action-item.interface';

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly items: AnimatedActionItemInterface[];
    readonly triggerIcon?: UserIconNameEnum;
}

const BACKDROP_OPACITY = 0.85;
const ANIMATION_DURATION = 200;
const BUTTON_SIZE = 56;
const ICON_SIZE = 24;
const AI_BUTTON_SIZE = 52;
const AI_ICON_SIZE = 24;
const AI_BUTTON_TRANSLATE_X = 50;
const BUTTON_ROTATION_ACTIVE = 45;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };
const AI_BUTTON_DELAY = 100;
const AI_SPRING_CONFIG = { damping: 14, stiffness: 160, mass: 0.7 };

const useBackdropAnimation = (isOpen: boolean) => {
    const opacity = useSharedValue(0);
    opacity.value = withTiming(isOpen ? BACKDROP_OPACITY : 0, { duration: ANIMATION_DURATION });

    return useAnimatedStyle(() => ({ opacity: opacity.value }));
};

const useButtonAnimation = (isOpen: boolean) => {
    const rotation = useSharedValue(0);
    rotation.value = withSpring(isOpen ? BUTTON_ROTATION_ACTIVE : 0, SPRING_CONFIG);

    return useAnimatedStyle(() => ({
        width: BUTTON_SIZE,
        height: BUTTON_SIZE,
        transform: [{ rotate: `${rotation.value}deg` }]
    }));
};

const useAiButtonAnimation = (isOpen: boolean) => {
    const scale = useSharedValue(0);
    const translateX = useSharedValue(AI_BUTTON_TRANSLATE_X);

    scale.value = isOpen ? withDelay(AI_BUTTON_DELAY, withSpring(1, AI_SPRING_CONFIG)) : withSpring(0, AI_SPRING_CONFIG);
    translateX.value = isOpen
        ? withDelay(AI_BUTTON_DELAY, withSpring(0, AI_SPRING_CONFIG))
        : withSpring(AI_BUTTON_TRANSLATE_X, AI_SPRING_CONFIG);

    return useAnimatedStyle(() => ({
        width: AI_BUTTON_SIZE,
        height: AI_BUTTON_SIZE,
        transform: [{ scale: scale.value }, { translateX: translateX.value }]
    }));
};

export const AnimatedActionMenu = ({ isOpen, onClose, items, triggerIcon = UserIconNameEnum.Plus }: Props) => {
    const [, hapticImpact] = useVibration();
    const { bottom } = useSafeAreaInsets();

    const backdropStyle = useBackdropAnimation(isOpen);
    const buttonStyle = useButtonAnimation(isOpen);
    const aiButtonStyle = useAiButtonAnimation(isOpen);

    const triggerClose = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onClose();
    };

    const handleAiPress = () => {
        onClose();
        router.push('/(main)/ai');
    };

    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(triggerClose)();
    });

    if (!isOpen) {
        return null;
    }

    const containerStyle = { paddingBottom: bottom, marginBottom: 4 };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <GestureDetector gesture={tapGesture}>
                <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
            </GestureDetector>

            <View className="absolute right-0 bottom-0 items-end px-lg pb-lg" style={containerStyle} pointerEvents="box-none">
                <View className="items-end" pointerEvents="box-none">
                    {items.map((item, index) => (
                        <AnimatedActionItem
                            key={item.label}
                            item={item}
                            index={index}
                            totalItems={items.length}
                            isOpen={isOpen}
                            onClose={onClose}
                        />
                    ))}

                    <View className="flex-row items-center gap-md">
                        <HapticPressable onPress={handleAiPress}>
                            <Animated.View className="bg-tertiary rounded-full items-center justify-center" style={aiButtonStyle}>
                                <Icon className="text-tertiary-reverse" icon={UserIconNameEnum.Mic} size={AI_ICON_SIZE} />
                            </Animated.View>
                        </HapticPressable>

                        <Pressable onPress={triggerClose}>
                            <Animated.View className="bg-primary rounded-full items-center justify-center" style={buttonStyle}>
                                <Icon className="text-primary-reverse" icon={triggerIcon} size={ICON_SIZE} />
                            </Animated.View>
                        </Pressable>
                    </View>
                </View>
            </View>
        </View>
    );
};
