import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { use } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useResolveClassNames } from 'uniwind';

import { useCollapsibleHeaderScroll } from '@rnw-community/react-native-collapsible-header';
import { useScreenChrome } from '@rnw-community/react-native-screen-chrome';

import { SCREEN_CHROME_CONTENT_INSET_TOP } from '../../constant/screen-chrome-content-inset.constant';
import { CollapsibleChromeCollapseDistanceContext } from '../../context/collapsible-chrome-collapse-distance.context';

import type { LegendListPositionSourceInterface } from '../../interface/legend-list-position-source.interface';
import type { LegendListProps } from '@legendapp/list/react-native';
import type { RefCallback } from 'react';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const CollapsibleChromeLegendList = <TItem,>({
    contentContainerStyle,
    ...props
}: LegendListProps<TItem> & { readonly ref?: RefCallback<LegendListPositionSourceInterface> }) => {
    const { scrollY } = useCollapsibleHeaderScroll();
    const { top } = useSafeAreaInsets();
    const { height } = useWindowDimensions();
    const { config } = useScreenChrome();
    const collapseDistance = use(CollapsibleChromeCollapseDistanceContext);
    const horizontalInset = useResolveClassNames('px-5xl');

    const sharedValues = { scrollOffset: scrollY };
    const contentContainerStyleWithInset = [
        { paddingTop: top + SCREEN_CHROME_CONTENT_INSET_TOP, minHeight: height + Math.max(config.collapseEnd, collapseDistance) },
        horizontalInset,
        contentContainerStyle
    ];

    return (
        <AnimatedLegendList
            {...props}
            contentContainerStyle={contentContainerStyleWithInset}
            sharedValues={sharedValues}
            maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
            recycleItems
            showsVerticalScrollIndicator={false}
        />
    );
};
