import { UserIconNameEnum } from '@budgie/contracts';
import { ImpactFeedbackStyle } from 'expo-haptics/src/Haptics.types';
import { Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { useVibration } from '../../hook/use-vibration.hook';
import { Icon } from '../icon/icon';

import { RadialActionItem } from './radial-action-item';

import type { RadialActionItemInterface } from './radial-action-item.interface';

interface Props {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly items: RadialActionItemInterface[];
    readonly triggerIcon?: UserIconNameEnum;
}

const BACKDROP_OPACITY = 0.85;
const ANIMATION_DURATION = 200;
const BUTTON_SIZE = 76;
const ICON_SIZE = 24;
const SPRING_CONFIG = { damping: 15, stiffness: 200, mass: 0.8 };

export const RadialActionMenu = ({ isOpen, onClose, items, triggerIcon = UserIconNameEnum.Plus }: Props) => {
    const [, hapticImpact] = useVibration();
    const backdropOpacity = useSharedValue(0);
    const buttonRotation = useSharedValue(0);
    const buttonScale = useSharedValue(1);

    const triggerClose = () => {
        hapticImpact(ImpactFeedbackStyle.Light);
        onClose();
    };

    const tapGesture = Gesture.Tap().onEnd(() => {
        runOnJS(triggerClose)();
    });

    if (isOpen) {
        backdropOpacity.value = withTiming(BACKDROP_OPACITY, { duration: ANIMATION_DURATION });
        buttonRotation.value = withSpring(45, SPRING_CONFIG);
        buttonScale.value = withSpring(0.9, SPRING_CONFIG);
    } else {
        backdropOpacity.value = withTiming(0, { duration: ANIMATION_DURATION });
        buttonRotation.value = withSpring(0, SPRING_CONFIG);
        buttonScale.value = withSpring(1, SPRING_CONFIG);
    }

    const backdropStyle = useAnimatedStyle(() => ({
        opacity: backdropOpacity.value
    }));

    const buttonAnimatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${buttonRotation.value}deg` }, { scale: buttonScale.value }]
    }));

    if (!isOpen) {
        return null;
    }

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            <GestureDetector gesture={tapGesture}>
                <Animated.View className="absolute inset-0 bg-black" style={backdropStyle} />
            </GestureDetector>

            <View className="absolute inset-x-0 bottom-0 items-center pb-4xl" pointerEvents="box-none">
                <View className="items-center" pointerEvents="box-none">
                    {items.map((item, index) => (
                        <RadialActionItem
                            key={item.label}
                            item={item}
                            index={index}
                            totalItems={items.length}
                            isOpen={isOpen}
                            onClose={onClose}
                        />
                    ))}

                    <Pressable onPress={triggerClose}>
                        <Animated.View
                            className="bg-primary rounded-full items-center justify-center"
                            style={[{ width: BUTTON_SIZE, height: BUTTON_SIZE }, buttonAnimatedStyle]}
                        >
                            <Icon className="text-primary-reverse" icon={triggerIcon} size={ICON_SIZE} />
                        </Animated.View>
                    </Pressable>
                </View>
            </View>
        </View>
    );
};
