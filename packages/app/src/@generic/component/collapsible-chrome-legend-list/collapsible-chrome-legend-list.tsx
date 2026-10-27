import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import {
    SCREEN_CHROME_HEADER_LAYOUT_METRICS,
    getScreenChromeHeaderMetrics,
    useScreenChrome
} from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';

import type { LegendListProps } from '@legendapp/list/react-native';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const CollapsibleChromeLegendList = <TItem,>({ contentContainerStyle, ...props }: LegendListProps<TItem>) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const { config } = useScreenChrome();
    const { top } = useSafeAreaInsets();
    const horizontalInset = useResolveClassNames('px-5xl');

    const sharedValues = { scrollOffset: scrollY };
    const contentContainerStyleWithInset = [{ paddingTop: top + SCREEN_CHROME_CONTENT_INSET_TOP }, horizontalInset, contentContainerStyle];
    const stickyHeaderConfig = {
        offset: getScreenChromeHeaderMetrics(
            Math.max(config.collapsedHeaderHeight ?? config.headerHeight, SCREEN_CHROME_HEADER_LAYOUT_METRICS.slotSize),
            top
        )
    };

    return (
        <AnimatedLegendList
            {...props}
            contentContainerStyle={contentContainerStyleWithInset}
            sharedValues={sharedValues}
            stickyHeaderConfig={stickyHeaderConfig}
            maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
            recycleItems
            showsVerticalScrollIndicator={false}
        />
    );
};
