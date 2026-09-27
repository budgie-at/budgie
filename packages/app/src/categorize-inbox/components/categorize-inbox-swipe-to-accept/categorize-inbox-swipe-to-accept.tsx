import { useRecyclingEffect } from '@legendapp/list/react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { isDefined } from '@rnw-community/shared';

import { testID } from '../../../@generic/utils/test-id.util';
import { CATEGORIZE_INBOX_SWIPE_THRESHOLD } from '../../constant/categorize-inbox-swipe-threshold.constant';
import { useCategorizeInboxTopSuggestion } from '../../hook/use-categorize-inbox-top-suggestion.hook';
import { CategorizeInboxSwipeAcceptAction } from '../categorize-inbox-swipe-accept-action/categorize-inbox-swipe-accept-action';

import { CategorizeInboxSwipeToAcceptSelector } from './categorize-inbox-swipe-to-accept.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';
import type { ReactNode } from 'react';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly children: ReactNode;
}

const SLIDE_OUT_DISTANCE = 480;
const SLIDE_OUT_TIMING = { duration: 200 };
const SNAP_BACK_SPRING = { damping: 20, stiffness: 200 };

export const CategorizeInboxSwipeToAccept = ({ cluster, children }: Props) => {
    const topSuggestion = useCategorizeInboxTopSuggestion(cluster);
    const translation = useSharedValue(0);
    const [isSwiping, setIsSwiping] = useState(false);

    useRecyclingEffect(() => {
        translation.set(0);
        setIsSwiping(false);
    });

    const handleSwipeStart = (): void => void setIsSwiping(true);
    const handleSwipeSettle = (): void => void setIsSwiping(false);
    const handleAccept = (): void => void topSuggestion?.accept();

    const panGesture = Gesture.Pan()
        .enabled(isDefined(topSuggestion))
        .activeOffsetX(10)
        .failOffsetY([-10, 10])
        .onStart(() => {
            scheduleOnRN(handleSwipeStart);
        })
        .onUpdate(event => {
            translation.set(Math.max(0, event.translationX));
        })
        .onEnd(event => {
            if (event.translationX >= CATEGORIZE_INBOX_SWIPE_THRESHOLD) {
                translation.set(withTiming(SLIDE_OUT_DISTANCE, SLIDE_OUT_TIMING));
                scheduleOnRN(handleAccept);

                return;
            }

            translation.set(
                withSpring(0, SNAP_BACK_SPRING, isFinished => {
                    if (isFinished === true) {
                        scheduleOnRN(handleSwipeSettle);
                    }
                })
            );
        });

    const contentStyle = useAnimatedStyle(() => ({ transform: [{ translateX: translation.get() }] }));

    const acceptAction =
        isSwiping && isDefined(topSuggestion) ? (
            <View className="absolute inset-0">
                <CategorizeInboxSwipeAcceptAction clusterKey={cluster.key} translation={translation} category={topSuggestion.category} />
            </View>
        ) : null;

    return (
        <GestureDetector gesture={panGesture}>
            <View {...testID(CategorizeInboxSwipeToAcceptSelector.Swipeable, cluster.key)}>
                {acceptAction}
                <Animated.View style={contentStyle}>{children}</Animated.View>
            </View>
        </GestureDetector>
    );
};
