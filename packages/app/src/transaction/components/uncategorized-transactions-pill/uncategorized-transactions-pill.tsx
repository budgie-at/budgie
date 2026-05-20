import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';
import { UncategorizedTransactionsPillPropsInterface } from '../../interface/uncategorized-transactions-pill-props.interface';

import { UncategorizedTransactionsPillSelector } from './uncategorized-transactions-pill.selector';

const ANIMATION_DURATION_MS = 180;
const PILL_ENTER_TRANSLATE_Y = -4;
const PILL_ENTER_SCALE = 0.98;
const PILL_SCALE_DELTA = 0.02;

export const UncategorizedTransactionsPill = ({ count, onPress }: UncategorizedTransactionsPillPropsInterface) => {
    const { t } = useLingui();
    const animationProgress = useSharedValue(0);

    const pillText = count === 1 ? t`${count} missing category` : t`${count} missing categories`;
    const pillAnimatedStyle = useAnimatedStyle(() => ({
        opacity: animationProgress.value,
        transform: [
            {
                translateY: PILL_ENTER_TRANSLATE_Y - animationProgress.value * PILL_ENTER_TRANSLATE_Y
            },
            {
                scale: PILL_ENTER_SCALE + animationProgress.value * PILL_SCALE_DELTA
            }
        ]
    }));

    useEffect(() => {
        animationProgress.set(withTiming(1, { duration: ANIMATION_DURATION_MS, easing: Easing.out(Easing.cubic) }));
    }, [animationProgress]);

    return (
        <Animated.View style={pillAnimatedStyle} className="self-start">
            <HapticPressable
                onPress={onPress}
                accessibilityRole="button"
                accessibilityLabel={pillText}
                testID={UncategorizedTransactionsPillSelector.Button}
                className="h-9 min-w-48 px-lg rounded-full border border-warning-corner bg-warning-background flex-row items-center justify-center gap-x-sm"
            >
                <View className="h-5 w-5 rounded-full bg-warning-corner items-center justify-center">
                    <Icon icon={UserIconNameEnum.BadgeQuestionMark} className="text-warning-foreground" size={14} />
                </View>
                <Text className="text-warning-foreground text-sm font-semibold" numberOfLines={1}>
                    {pillText}
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
