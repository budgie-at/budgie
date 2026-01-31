import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { CircleIcon } from '../../../@generic/component/circle-icon/circle-icon';
import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly icon: UserIconNameEnum;
    readonly onPress: () => void;
}

const BOUNCE_SCALE = 1.08;
const BOUNCE_SPRING = { damping: 12, mass: 0.8, stiffness: 200 };
const RETURN_SPRING = { damping: 15, mass: 1, stiffness: 150 };
const PRESSED_SCALE = 0.95;
const ICON_SIZE = 96;
const INNER_ICON_SIZE = 44;
const ICON_RADIUS = 32;
const EDIT_BADGE_SIZE = 28;
const EDIT_BADGE_STYLE = { width: EDIT_BADGE_SIZE, height: EDIT_BADGE_SIZE };

export const CategoryIconDisplay = ({ icon, onPress }: Props) => {
    const scale = useSharedValue(1);
    const pressed = useSharedValue(false);
    const previousIcon = useRef(icon);

    useEffect(() => {
        if (icon !== previousIcon.current) {
            scale.set(
                withSpring(BOUNCE_SCALE, BOUNCE_SPRING, finished => {
                    if (finished) {
                        scale.set(withSpring(1, RETURN_SPRING));
                    }
                })
            );
            previousIcon.current = icon;
        }
    }, [icon, scale]);

    const animatedStyle = useAnimatedStyle(() => {
        const pressedScale = pressed.value ? PRESSED_SCALE : 1;

        return {
            transform: [{ scale: scale.value * pressedScale }]
        };
    });

    const handlePressIn = () => {
        pressed.value = true;
    };

    const handlePressOut = () => {
        pressed.value = false;
    };

    return (
        <Animated.View entering={FadeIn.duration(200)} className="items-center justify-center py-3xl gap-y-lg">
            <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
                <Animated.View style={animatedStyle}>
                    <CircleIcon icon={icon} variant="default" size={ICON_SIZE} iconSize={INNER_ICON_SIZE} radius={ICON_RADIUS} />
                    <View
                        className="absolute -bottom-xs -right-xs bg-cta-background rounded-full items-center justify-center"
                        style={EDIT_BADGE_STYLE}
                    >
                        <Icon icon={UserIconNameEnum.Pencil} size={14} className="text-cta-foreground" />
                    </View>
                </Animated.View>
            </Pressable>
            <Text className="text-xs text-secondary-foreground">
                <Trans>Tap to change icon</Trans>
            </Text>
        </Animated.View>
    );
};
