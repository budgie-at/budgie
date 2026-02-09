import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

interface Props {
    readonly isAnimating?: boolean;
}

const ANIMATION_DURATION = 800;
const MIN_OPACITY = 0.4;

export const SuggestionLoadingIndicator = ({ isAnimating = false }: Props) => {
    const { t } = useLingui();
    const opacity = useSharedValue(1);

    useEffect(() => {
        if (isAnimating) {
            opacity.value = MIN_OPACITY;
            opacity.value = withRepeat(withTiming(1, { duration: ANIMATION_DURATION }), -1, true);
        } else {
            cancelAnimation(opacity);
            opacity.value = 1;
        }

        return () => void cancelAnimation(opacity);
    }, [isAnimating, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={animatedStyle} className="flex-row items-center gap-xs pl-sm pr-[8%] shrink-0">
            <Icon icon={UserIconNameEnum.ArrowLeft} size={12} className="text-secondary-foreground" />
            <Text className="text-xs text-secondary-foreground">{t`AI`}</Text>
            <Icon icon={UserIconNameEnum.Sparkles} size={12} className="text-secondary-foreground" />
        </Animated.View>
    );
};
