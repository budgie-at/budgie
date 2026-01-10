import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVibration } from '../../hook/use-vibration.hook';
import { Icon } from '../icon/icon';

import { AiActionButton } from './ai-action-button/ai-action-button';
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
const BUTTON_ROTATION_ACTIVE = 45;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };

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

export const AnimatedActionMenu = ({ isOpen, onClose, items, triggerIcon = UserIconNameEnum.Plus }: Props) => {
    const [, hapticImpact] = useVibration();
    const { bottom } = useSafeAreaInsets();

    const backdropStyle = useBackdropAnimation(isOpen);
    const buttonStyle = useButtonAnimation(isOpen);

    const triggerClose = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onClose();
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
                    <AiActionButton isOpen={isOpen} onClose={onClose} totalItems={items.length} />

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

                    <Pressable onPress={triggerClose}>
                        <Animated.View className="bg-primary rounded-full items-center justify-center" style={buttonStyle}>
                            <Icon className="text-primary-reverse" icon={triggerIcon} size={ICON_SIZE} />
                        </Animated.View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};
