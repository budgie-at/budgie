import { UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Icon } from '../../../@generic/component/icon/icon';

const ANIMATION_DURATION = 800;
const INITIAL_OPACITY = 0.4;

export const CategorySuggestionLoadingIndicator = () => {
    const { t } = useLingui();
    const opacity = useSharedValue(INITIAL_OPACITY);

    useEffect(() => {
        opacity.value = withRepeat(withTiming(1, { duration: ANIMATION_DURATION }), -1, true);
    }, [opacity]);

    const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

    return (
        <Animated.View style={animatedStyle} className="flex-row items-center gap-xs px-lg">
            <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-secondary-foreground" />
            <Text className="text-xs text-secondary-foreground">{t`AI`}</Text>
        </Animated.View>
    );
};
