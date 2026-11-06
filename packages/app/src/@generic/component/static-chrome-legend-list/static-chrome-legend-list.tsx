import { AnimatedLegendList } from '@legendapp/list/reanimated';

import { useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';

import type { LegendListPositionSourceInterface } from '../../interface/legend-list-position-source.interface';
import type { LegendListProps } from '@legendapp/list/react-native';
import type { RefCallback } from 'react';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };

export const StaticChromeLegendList = <TItem,>({
    contentContainerStyle,
    ref,
    ...props
}: LegendListProps<TItem> & { readonly ref?: RefCallback<LegendListPositionSourceInterface> }) => {
    const { ref: refScrollView, ...scrollProps } = useScreenChromeScrollProps({
        includeTopSafeArea: false,
        contentInsetTop: 12,
        contentContainerStyle
    });

    return (
        <AnimatedLegendList
            {...props}
            {...scrollProps}
            extraData={props.extraData ?? props.renderItem}
            ref={ref}
            refScrollView={refScrollView}
            maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
            recycleItems
            showsVerticalScrollIndicator={false}
        />
    );
};
