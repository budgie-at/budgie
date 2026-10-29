import { useState } from 'react';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { isDefined } from '@rnw-community/shared';

import { getCollapsibleChromePinDistance } from '../../../@generic/utils/get-collapsible-chrome-pin-distance.util';
import { TransactionSectionHeader } from '../transaction-section-header/transaction-section-header';

import type { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly sections: TransactionsByDaySectionInterface[];
    readonly headerOffsets: SharedValue<number[]>;
    readonly anchorY: number;
}

const PINNED_DAY_HEIGHT = 32;
const OFFSET_TOLERANCE = 0.5;

export const TransactionListPinnedDay = ({ sections, headerOffsets, anchorY }: Props) => {
    const [sectionIndex, setSectionIndex] = useState(0);

    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();

    const pinDistance = getCollapsibleChromePinDistance(anchorY, top);

    useAnimatedReaction(
        () => Math.max(headerOffsets.value.filter(offset => offset <= scrollY.value - pinDistance + OFFSET_TOLERANCE).length - 1, 0),
        (nextIndex, previousIndex) => {
            if (nextIndex !== previousIndex) {
                runOnJS(setSectionIndex)(nextIndex);
            }
        }
    );

    const pushStyle = useAnimatedStyle(() => {
        const pinnedScroll = scrollY.value - pinDistance;
        const nextOffset = headerOffsets.value.find(offset => offset > pinnedScroll + OFFSET_TOLERANCE) ?? pinnedScroll + PINNED_DAY_HEIGHT;
        const distanceToNext = nextOffset - pinnedScroll - PINNED_DAY_HEIGHT;

        return { transform: [{ translateY: Math.min(Math.max(distanceToNext, -PINNED_DAY_HEIGHT), 0) }] };
    });

    const section = sections.at(Math.min(sectionIndex, sections.length - 1));

    return (
        <Animated.View className="h-[32px] bg-surface px-5xl" style={pushStyle}>
            {isDefined(section) ? <TransactionSectionHeader title={section.title} netAmount={section.netAmount} /> : null}
        </Animated.View>
    );
};
