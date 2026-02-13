import { UserIconNameEnum } from '@budgie/contracts';
import { Trans } from '@lingui/react/macro';
import { useEffect } from 'react';
import { Text } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { SuggestRuleSelectors } from '../../../@e2e/selectors/suggest-rule.selector';
import { HapticPressable } from '../../../@generic/component/haptic-pressable/haptic-pressable';
import { Icon } from '../../../@generic/component/icon/icon';

const ANIMATION_DURATION = 300;

interface Props {
    readonly visible: boolean;
    readonly onPress: () => void;
}

export const SuggestRulePill = ({ visible, onPress }: Props) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
        opacity.value = withTiming(visible ? 1 : 0, { duration: ANIMATION_DURATION });
    }, [visible, opacity]);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    const pointerEventsMode = visible ? 'auto' : 'none';

    return (
        <Animated.View style={animatedStyle} className="items-center py-sm" pointerEvents={pointerEventsMode}>
            <HapticPressable
                testID={SuggestRuleSelectors.AddRuleButton}
                className="flex-row items-center gap-x-sm rounded-full border border-primary/15 bg-ghost-background px-xl py-sm"
                onPress={onPress}
            >
                <Icon icon={UserIconNameEnum.Sparkles} size={14} className="text-primary" />
                <Text className="text-xs font-medium text-primary">
                    <Trans>Automate this?</Trans>
                </Text>
            </HapticPressable>
        </Animated.View>
    );
};
