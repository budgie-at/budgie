import { useState } from 'react';
import { View } from 'react-native';
import Animated, { runOnJS, useAnimatedReaction, useAnimatedStyle, useDerivedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';

import { useReducedMotion } from '../../../@generic/hook/use-reduced-motion.hook';
import { getCollapsibleChromePinDistance } from '../../../@generic/utils/get-collapsible-chrome-pin-distance.util';
import { PINNED_DAY_HEIGHT } from '../../constant/pinned-day-height.constant';
import { TransactionListPinnedDayRow } from '../transaction-list-pinned-day-row/transaction-list-pinned-day-row';

import type { TransactionsByDaySectionInterface } from '../../interface/transactions-by-day-section.interface';
import type { SharedValue } from 'react-native-reanimated';

interface Props {
    readonly sections: TransactionsByDaySectionInterface[];
    readonly headerOffsets: SharedValue<number[]>;
    readonly anchorY: number;
}

const OFFSET_TOLERANCE = 0.5;

export const TransactionListPinnedDay = ({ sections, headerOffsets, anchorY }: Props) => {
    const [sectionIndex, setSectionIndex] = useState(0);

    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();
    const reducedMotion = useReducedMotion();

    const pinDistance = getCollapsibleChromePinDistance(anchorY, top);
    const currentIndex = Math.max(Math.min(sectionIndex, sections.length - 1), 0);

    useAnimatedReaction(
        () => Math.max(headerOffsets.value.filter(offset => offset <= scrollY.value - pinDistance + OFFSET_TOLERANCE).length - 1, 0),
        (nextIndex, previousIndex) => {
            if (nextIndex !== previousIndex) {
                runOnJS(setSectionIndex)(nextIndex);
            }
        }
    );

    const stackLag = useDerivedValue(() => {
        const pinnedScroll = scrollY.value - pinDistance;

        return Math.max(headerOffsets.value.filter(offset => offset <= pinnedScroll + OFFSET_TOLERANCE).length - 1, 0) - currentIndex;
    });
    const pushStyle = useAnimatedStyle(() => {
        const indexLag = Math.min(Math.max(stackLag.value, -1), 1);
        const pinnedScroll = scrollY.value - pinDistance;
        const nextOffset = headerOffsets.value.at(currentIndex + indexLag + 1) ?? pinnedScroll + PINNED_DAY_HEIGHT;
        const push = reducedMotion ? 0 : Math.min(Math.max(nextOffset - pinnedScroll - PINNED_DAY_HEIGHT, -PINNED_DAY_HEIGHT), 0);

        return {
            opacity: Math.abs(stackLag.value) > 1 ? 0 : 1,
            transform: [{ translateY: Math.min(Math.max(-PINNED_DAY_HEIGHT * (1 + indexLag) + push, -2 * PINNED_DAY_HEIGHT), 0) }]
        };
    });

    const stackSections = [
        { key: 'previous', section: currentIndex > 0 ? (sections.at(currentIndex - 1) ?? null) : null },
        { key: 'current', section: sections.at(currentIndex) ?? null },
        { key: 'next', section: sections.at(currentIndex + 1) ?? null }
    ];

    return (
        <View>
            <View className="h-[33px] overflow-hidden bg-surface pt-px">
                <Animated.View style={pushStyle}>
                    {stackSections.map(({ key, section }) => (
                        <TransactionListPinnedDayRow key={key} section={section} />
                    ))}
                </Animated.View>
            </View>

            <View className="h-hairline bg-primary/10" />
        </View>
    );
};
