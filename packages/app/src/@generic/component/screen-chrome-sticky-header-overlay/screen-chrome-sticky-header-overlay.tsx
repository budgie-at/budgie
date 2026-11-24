import { use, useState } from 'react';
import Animated, { useAnimatedReaction, useAnimatedStyle } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ScreenChromeStickyHeadersContext } from '../../context/screen-chrome-sticky-headers.context';
import { ScreenChromeStickyHeaderRow } from '../screen-chrome-sticky-header-row/screen-chrome-sticky-header-row';
import { StickySectionHeaderBackdrop } from '../sticky-section-header-backdrop/sticky-section-header-backdrop';

import type { ScreenChromeStickyHeaderSourceInterface } from '../../interface/screen-chrome-sticky-header-source.interface';

const EMPTY_INDICES: readonly number[] = [];

interface Props {
    readonly source: ScreenChromeStickyHeaderSourceInterface | null;
}

export const ScreenChromeStickyHeaderOverlay = ({ source }: Props) => {
    const context = use(ScreenChromeStickyHeadersContext);
    const state = context?.state;
    const anchor = context?.anchor;
    const [activeIndex, setActiveIndex] = useState(-1);

    useAnimatedReaction(
        () => state?.get().index ?? -1,
        (nextIndex, previousIndex) => {
            if (nextIndex !== previousIndex) {
                scheduleOnRN(setActiveIndex, nextIndex);
            }
        }
    );

    const style = useAnimatedStyle(() => ({
        position: 'absolute',
        top: anchor?.get() ?? 0,
        left: 0,
        right: 0,
        height: state?.get().height ?? 0,
        overflow: 'hidden',
        zIndex: 4
    }));

    const indices = source?.indices ?? EMPTY_INDICES;
    const horizontalInset = source?.horizontalInset ?? 0;
    const clampedActiveIndex = Math.min(activeIndex, indices.length - 1);
    const visiblePositions = [clampedActiveIndex, clampedActiveIndex + 1].filter(position => position >= 0 && position < indices.length);

    return (
        <Animated.View
            style={style}
            pointerEvents="none"
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
        >
            <StickySectionHeaderBackdrop />
            {visiblePositions.map(position => (
                <ScreenChromeStickyHeaderRow key={indices[position]} position={position} horizontalInset={horizontalInset}>
                    {source?.renderHeader(position)}
                </ScreenChromeStickyHeaderRow>
            ))}
        </Animated.View>
    );
};
