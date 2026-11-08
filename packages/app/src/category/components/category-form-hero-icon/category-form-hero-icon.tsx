import { isEmojiIcon, UserIconNameEnum, UserIconType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
    FadeIn,
    FadeOut,
    LayoutAnimationConfig,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withSpring,
    withTiming
} from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { EASE_OUT, MOTION_FAST_DURATION } from '../../../@generic/constant/motion.constant';
import { useIconSearchEntries } from '../../../@generic/hook/use-icon-search-entries.hook';
import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { CategoryFormSelector } from '../category-form/category-form.selector';

interface Props {
    readonly icon: UserIconType;
    readonly onPress: () => void;
}

const GLYPH_ENTERING = FadeIn.duration(MOTION_FAST_DURATION).easing(EASE_OUT);
const GLYPH_EXITING = FadeOut.duration(MOTION_FAST_DURATION).easing(EASE_OUT);
const POP_START_SCALE = 0.88;
const POP_SPRING = { dampingRatio: 0.6, duration: 380 };

export const CategoryFormHeroIcon = ({ icon, onPress }: Props) => {
    const { t } = useLingui();
    const iconName = useIconSearchEntries().find(entry => entry.icon === icon)?.label ?? icon;
    const isReducedMotion = useReducedMotion();
    const previousIconRef = useRef(icon);
    const scale = useSharedValue(1);
    const iconSize = isEmojiIcon(icon) ? 42 : 38;

    const discStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

    useEffect(() => {
        if (previousIconRef.current === icon) {
            return;
        }

        previousIconRef.current = icon;

        if (!isReducedMotion) {
            scale.set(withSequence(withTiming(POP_START_SCALE, { duration: 0 }), withSpring(1, POP_SPRING)));
        }
    }, [icon, isReducedMotion, scale]);

    return (
        <HapticPressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={t`Change icon, current: ${iconName}`}
            accessibilityHint={t`Opens the icon picker`}
            className="active:opacity-80"
            testID={CategoryFormSelector.IconTrigger}
        >
            <View testID={CategoryFormSelector.CurrentIcon(icon)}>
                <Animated.View className="h-[88px] w-[88px] rounded-full bg-surface-disc" style={discStyle}>
                    <LayoutAnimationConfig skipEntering>
                        <Animated.View
                            key={icon}
                            entering={GLYPH_ENTERING}
                            exiting={GLYPH_EXITING}
                            className="absolute inset-0 items-center justify-center"
                        >
                            <Icon icon={icon} size={iconSize} className="text-secondary-foreground" />
                        </Animated.View>
                    </LayoutAnimationConfig>
                </Animated.View>
            </View>
            <View className="absolute -right-[2px] -bottom-[2px] h-[30px] w-[30px] items-center justify-center rounded-full border-[3px] border-sheet-surface bg-surface-disc">
                <Icon icon={UserIconNameEnum.Pencil} size={14} className="text-primary" />
            </View>
        </HapticPressable>
    );
};
