import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly isExpanded: boolean;
    readonly accessibilityLabel: string;
    readonly onPress: () => void;
}

const TOGGLE_TIMING = { duration: 200 };
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
