import { ImpactFeedbackStyle } from 'expo-haptics';
import { Text, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { Icon } from '../../../@generic/component/icon/icon';
import { useVibration } from '../../../@generic/hook/use-vibration.hook';
import { testID } from '../../../@generic/utils/test-id.util';
import { CATEGORIZE_INBOX_SWIPE_THRESHOLD } from '../../constant/categorize-inbox-swipe-threshold.constant';

import { CategorizeInboxSwipeAcceptActionSelector } from './categorize-inbox-swipe-accept-action.selector';

import type { CategoryEntityInterface } from '@budgie/contracts';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly clusterKey: string;
    readonly translation: SharedValue<number>;
    readonly category: Pick<CategoryEntityInterface, 'title' | 'icon'>;
}

export const CategorizeInboxSwipeAcceptAction = ({ clusterKey, translation, category }: Props) => {
    const [, hapticImpact] = useVibration();

    const handleThresholdReached = (): void => void hapticImpact(ImpactFeedbackStyle.Light);

    useAnimatedReaction(
        () => translation.get() >= CATEGORIZE_INBOX_SWIPE_THRESHOLD,
        (isPastThreshold, wasPastThreshold) => {
            if (isPastThreshold && wasPastThreshold === false) {
                scheduleOnRN(handleThresholdReached);
            }
        }
    );

    const contentStyle = useAnimatedStyle(() => ({
        opacity: interpolate(translation.get(), [0, CATEGORIZE_INBOX_SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP)
    }));

    return (
        <View
            className="flex-1 flex-row items-center rounded-5xl border border-positive-corner bg-positive-background px-xl"
            {...testID(CategorizeInboxSwipeAcceptActionSelector.Action, clusterKey)}
        >
            <Animated.View style={contentStyle} className="flex-row items-center gap-x-md">
                <Icon icon={category.icon} size={20} className="text-positive-foreground" />
                <Text className="shrink text-sm font-semibold text-positive-foreground" numberOfLines={1}>
                    {category.title}
                </Text>
            </Animated.View>
        </View>
    );
};
