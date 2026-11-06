import { AnimatedLegendList } from '@legendapp/list/reanimated';

import { useScreenChrome, useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

import { getScreenChromeStickyHeaderConfig } from '../../utils/get-screen-chrome-sticky-header-config.util';
import { ScreenChromeListHeader } from '../screen-chrome-list-header/screen-chrome-list-header';

import type { LegendListPositionSourceInterface } from '../../interface/legend-list-position-source.interface';
import type { LegendListProps } from '@legendapp/list/react-native';
import type { RefCallback } from 'react';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };
const CONTENT_INSET_TOP = 12;

export const StaticChromeLegendList = <TItem,>({
    contentContainerStyle,
    ListHeaderComponent,
    ref,
    ...props
}: LegendListProps<TItem> & { readonly ref?: RefCallback<LegendListPositionSourceInterface> }) => {
    const { config } = useScreenChrome();
    const stickyHeaderConfig = getScreenChromeStickyHeaderConfig(config, config.headerHeight);
    const minimumHeaderHeight = Math.max((stickyHeaderConfig.offset ?? 0) - CONTENT_INSET_TOP, 0);
    const { ref: refScrollView, ...scrollProps } = useScreenChromeScrollProps({
        includeTopSafeArea: false,
        contentInsetTop: CONTENT_INSET_TOP,
        contentContainerStyle
    });

    return (
        <AnimatedLegendList
            {...props}
            {...scrollProps}
            stickyHeaderConfig={stickyHeaderConfig}
            ListHeaderComponent={<ScreenChromeListHeader header={ListHeaderComponent} minimumHeight={minimumHeaderHeight} />}
            extraData={props.extraData ?? props.renderItem}
            ref={ref}
            refScrollView={refScrollView}
            maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
            recycleItems
            showsVerticalScrollIndicator={false}
        />
    );
};
