import { UserIconNameEnum } from '@budgie/contracts';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly label: string;
    readonly isFlipped: boolean;
}

const ANIMATION_DURATION = 200;
const ENTERING = FadeIn.duration(ANIMATION_DURATION);
const EXITING = FadeOut.duration(ANIMATION_DURATION);
const LAYOUT = LinearTransition.duration(ANIMATION_DURATION);
const ICON_SIZE = 14;
const ROTATION_DEGREES = 180;
const SPRING_CONFIG = { damping: 12, stiffness: 200 };

export const CurrencyModePill = ({ label, isFlipped }: Props) => {
    const rotation = useSharedValue(0);

    useEffect(() => {
        rotation.set(withSpring(isFlipped ? ROTATION_DEGREES : 0, SPRING_CONFIG));
    }, [isFlipped, rotation]);

    const iconStyle = useAnimatedStyle(() => ({
        transform: [{ rotate: `${rotation.value}deg` }]
    }));

    return (
        <Animated.View
            entering={ENTERING}
            exiting={EXITING}
            layout={LAYOUT}
            className="flex-row items-center gap-x-xs bg-ghost-background rounded-xl px-xl py-xs mt-sm"
        >
            <Animated.View style={iconStyle}>
                <Icon icon={UserIconNameEnum.ArrowUpDown} className="text-secondary-foreground" size={ICON_SIZE} />
            </Animated.View>
            <Text className="text-xs text-secondary-foreground uppercase font-medium">{label}</Text>
        </Animated.View>
    );
};
