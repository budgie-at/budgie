import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { EASE_IN_OUT, MOTION_BASE_DURATION } from '../../../@generic/constant/motion.constant';

interface Props {
    readonly isExpanded: boolean;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
}

const TOGGLE_TIMING = { duration: MOTION_BASE_DURATION, easing: EASE_IN_OUT };
const EXPANDED_ANGLE = 180;
const COLLAPSED_OPACITY = 0.45;

export const RuleFormCollapseToggle = ({ isExpanded, accessibilityLabel, onPress }: Props) => {
    const angle = useSharedValue(isExpanded ? 0 : EXPANDED_ANGLE);
    const accessibilityState = { expanded: isExpanded };

    useEffect(() => {
        angle.set(withTiming(isExpanded ? EXPANDED_ANGLE : 0, TOGGLE_TIMING));
    }, [angle, isExpanded]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${angle.get()}deg` }],
        opacity: COLLAPSED_OPACITY + ((1 - COLLAPSED_OPACITY) * angle.get()) / EXPANDED_ANGLE
    }));

    return (
        <HapticPressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={accessibilityState}
            className="h-[44px] w-[44px] items-center justify-center active:opacity-60"
        >
            <Animated.View style={animatedStyle}>
                <Icon icon={UserIconNameEnum.ChevronDown} size={18} className="text-secondary-foreground" />
            </Animated.View>
        </HapticPressable>
    );
};
