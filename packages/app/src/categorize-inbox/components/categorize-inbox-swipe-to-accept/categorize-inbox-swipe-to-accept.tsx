import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';

import { isDefined } from '@rnw-community/shared';

import { testID } from '../../../@generic/utils/test-id.util';
import { CATEGORIZE_INBOX_SWIPE_THRESHOLD } from '../../constant/categorize-inbox-swipe-threshold.constant';
import { useCategorizeInboxTopSuggestion } from '../../hook/use-categorize-inbox-top-suggestion.hook';
import { CategorizeInboxSwipeAcceptAction } from '../categorize-inbox-swipe-accept-action/categorize-inbox-swipe-accept-action';

import { CategorizeInboxSwipeToAcceptSelector } from './categorize-inbox-swipe-to-accept.selector';

import type { CategorizeInboxClusterInterface } from '../../interface/categorize-inbox-cluster.interface';
import type { ReactNode } from 'react';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly cluster: CategorizeInboxClusterInterface;
    readonly children: ReactNode;
}

const SWIPE_ANIMATION_OPTIONS = { duration: 300, dampingRatio: 1 };

export const CategorizeInboxSwipeToAccept = ({ cluster, children }: Props) => {
    const topSuggestion = useCategorizeInboxTopSuggestion(cluster);

    const renderLeftActions = (_: SharedValue<number>, translation: SharedValue<number>) =>
        isDefined(topSuggestion) ? (
            <CategorizeInboxSwipeAcceptAction clusterKey={cluster.key} translation={translation} category={topSuggestion.category} />
        ) : null;

    return (
        <ReanimatedSwipeable
            friction={2}
            enableTrackpadTwoFingerGesture
            leftThreshold={CATEGORIZE_INBOX_SWIPE_THRESHOLD}
            enabled={isDefined(topSuggestion)}
            animationOptions={SWIPE_ANIMATION_OPTIONS}
            renderLeftActions={renderLeftActions}
            onSwipeableOpen={topSuggestion?.accept}
            {...testID(CategorizeInboxSwipeToAcceptSelector.Swipeable, cluster.key)}
        >
            {children}
        </ReanimatedSwipeable>
    );
};
