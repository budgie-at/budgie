import { cva } from 'class-variance-authority';
import { useState } from 'react';
import { View } from 'react-native';
import { runOnJS, useAnimatedReaction } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { SCREEN_CHROME_HEADER_LAYOUT_METRICS, getScreenChromeHeaderMetrics } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../../@generic/constant/screen-chrome-content-inset.constant';
import { TransactionFilters } from '../transaction-filters/transaction-filters';

import type { ComponentProps } from 'react';
import type { LayoutChangeEvent } from 'react-native';

interface Props extends Omit<ComponentProps<typeof TransactionFilters>, 'showTypeFilter'> {
    readonly anchorY: number;
    readonly onHeightChange: (height: number) => void;
}

const barVariants = cva('absolute inset-x-0 bg-primary-reverse px-5xl pt-5xl pb-md', {
    variants: { isPinned: { true: 'opacity-100', false: 'opacity-0' } }
});

export const PinnedTransactionFilters = ({ anchorY, onHeightChange, ...filtersProps }: Props) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();
    const [chipsY, setChipsY] = useState(0);
    const [isPinned, setIsPinned] = useState(false);

    const barTop = getScreenChromeHeaderMetrics(SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize, top);
    const pinThreshold = anchorY + SCREEN_CHROME_CONTENT_INSET_TOP - SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize - chipsY;

    useAnimatedReaction(
        () => scrollY.value >= pinThreshold,
        (shouldPin, wasPinned) => {
            if (shouldPin !== wasPinned) {
                runOnJS(setIsPinned)(shouldPin);
            }
        },
        [pinThreshold]
    );

    const handleBarLayout = (event: LayoutChangeEvent) => void onHeightChange(event.nativeEvent.layout.height);
    const handleChipsLayout = (event: LayoutChangeEvent) => void setChipsY(event.nativeEvent.layout.y);

    const barStyle = { top: barTop };
    const barPointerEvents = isPinned ? 'auto' : 'none';
    const barAccessibility = isPinned ? 'auto' : 'no-hide-descendants';

    return (
        <View
            className={barVariants({ isPinned })}
            style={barStyle}
            pointerEvents={barPointerEvents}
            accessibilityElementsHidden={!isPinned}
            importantForAccessibility={barAccessibility}
            onLayout={handleBarLayout}
        >
            <View onLayout={handleChipsLayout}>
                <TransactionFilters {...filtersProps} />
            </View>
        </View>
    );
};
