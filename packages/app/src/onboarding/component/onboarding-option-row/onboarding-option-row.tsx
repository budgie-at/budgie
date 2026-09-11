import { UserIconNameEnum } from '@budgie/contracts';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { EmptyFn } from '@rnw-community/shared';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

const PRESS_SCALE = 0.97;
const FULL_SCALE = 1;
const PRESS_SPRING_CONFIG = { damping: 15, stiffness: 300 };
const SELECTION_TRANSITION_DURATION = 140;
const TICK_INITIAL_SCALE = 0.6;
const TICK_SPRING_CONFIG = { damping: 12, stiffness: 200 };
const FULL_OPACITY = 1;
const ZERO_OPACITY = 0;
const ICON_TILE_SIZE = 40;
const ICON_TILE_ICON_SIZE = 20;
const ICON_TILE_RADIUS = 14;
const TICK_ICON_SIZE = 16;

interface Props {
    readonly icon: UserIconNameEnum;
    readonly title: string;
    readonly isSelected: boolean;
    readonly onPress: EmptyFn;
    readonly testID?: string;
}

export const OnboardingOptionRow = (props: Props) => {
    const { icon, title, isSelected, onPress, testID } = props;

    const reducedMotion = useReducedMotion();
    const pressScale = useSharedValue(FULL_SCALE);
    const targetOpacity = isSelected ? FULL_OPACITY : ZERO_OPACITY;
    const targetTickScale = isSelected ? FULL_SCALE : TICK_INITIAL_SCALE;

    const handlePressIn = () => {
        pressScale.value = reducedMotion ? PRESS_SCALE : withSpring(PRESS_SCALE, PRESS_SPRING_CONFIG);
    };

    const handlePressOut = () => {
        pressScale.value = reducedMotion ? FULL_SCALE : withSpring(FULL_SCALE, PRESS_SPRING_CONFIG);
    };

    const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }));
    const selectionOverlayStyle = useAnimatedStyle(() => ({
        opacity: reducedMotion ? targetOpacity : withTiming(targetOpacity, { duration: SELECTION_TRANSITION_DURATION })
    }));
    const tickStyle = useAnimatedStyle(() => ({
        transform: [{ scale: reducedMotion ? targetTickScale : withSpring(targetTickScale, TICK_SPRING_CONFIG) }]
    }));

    return (
        <Animated.View style={pressStyle}>
            <HapticPressable
                testID={testID}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                className="rounded-3xl border-2 border-secondary-corner/50 p-3xl flex-row items-center gap-x-xl overflow-hidden"
            >
                <Animated.View
                    pointerEvents="none"
                    style={selectionOverlayStyle}
                    className="absolute inset-0 rounded-3xl border-2 border-secondary-corner bg-secondary-background"
                />

                <CircleIcon icon={icon} variant="ghost" size={ICON_TILE_SIZE} iconSize={ICON_TILE_ICON_SIZE} radius={ICON_TILE_RADIUS} />

                <Text className="text-primary text-md font-medium flex-1">{title}</Text>

                {isSelected ? (
                    <Animated.View style={tickStyle} className="bg-primary rounded-full p-xs">
                        <Icon icon={UserIconNameEnum.Check} size={TICK_ICON_SIZE} className="text-primary-reverse" />
                    </Animated.View>
                ) : null}
            </HapticPressable>
        </Animated.View>
    );
};
