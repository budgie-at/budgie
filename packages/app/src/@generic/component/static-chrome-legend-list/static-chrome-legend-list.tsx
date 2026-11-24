import { AnimatedLegendList } from '@legendapp/list/reanimated';
import { useResolveClassNames } from 'uniwind';

import { useScreenChrome, useScreenChromeScrollProps } from '@rnw-community/react-native-screen-chrome';
import { isDefined, isNumber } from '@rnw-community/shared';

import { useScreenChromeStickyList } from '../../hook/use-screen-chrome-sticky-list.hook';
import { StickyHeaderRow } from '../sticky-header-row/sticky-header-row';

import type { LegendListPositionSourceInterface } from '../../interface/legend-list-position-source.interface';
import type { LegendListMetrics, LegendListProps, LegendListRef } from '@legendapp/list/react-native';
import type { RefCallback } from 'react';

const MAINTAIN_VISIBLE_CONTENT_POSITION = { data: false, size: true };
const CONTENT_INSET_TOP = 12;
const EMPTY_INDICES: readonly number[] = [];

export const StaticChromeLegendList = <TItem,>({
    contentContainerStyle,
    ListHeaderComponent,
    data,
    renderItem,
    ref,
    ...props
}: LegendListProps<TItem> & { readonly ref?: RefCallback<LegendListPositionSourceInterface> }) => {
    const { config } = useScreenChrome();
    const horizontalStyle = useResolveClassNames('px-5xl');
    const horizontalInset = horizontalStyle.paddingHorizontal ?? horizontalStyle.paddingLeft;
    const extraData: unknown = props.extraData;
    const stickyHeaderIndices = props.stickyHeaderIndices ?? EMPTY_INDICES;
    const renderStickyHeader = (position: number) => {
        const index = stickyHeaderIndices.at(position);
        const item = isDefined(index) ? data?.at(index) : null;

        return isDefined(index) && isDefined(item) && isDefined(data) && isDefined(renderItem) ? (
            <StickyHeaderRow
                renderItem={renderItem}
                item={item}
                index={index}
                data={data}
                extraData={extraData}
                type={props.getItemType?.(item, index)}
            />
        ) : null;
    };
    const {
        handleListRef: setList,
        onMetricsChange,
        publish,
        stickyHeaderConfig
    } = useScreenChromeStickyList(
        {
            indices: stickyHeaderIndices,
            horizontalInset: isNumber(horizontalInset) ? horizontalInset : 0,
            contentKey: data,
            extraContentKey: extraData,
            renderHeader: renderStickyHeader
        },
        CONTENT_INSET_TOP,
        config.headerHeight
    );
    const { ref: refScrollView, ...scrollProps } = useScreenChromeScrollProps({
        includeTopSafeArea: false,
        contentInsetTop: CONTENT_INSET_TOP,
        contentContainerStyle
    });
    const handleListRef = (list: LegendListRef | null) => {
        setList(list);
        ref?.(list);
    };
    const handleMetricsChange = (metrics: LegendListMetrics) => {
        onMetricsChange(metrics);
        props.onMetricsChange?.(metrics);
    };
    const handleItemSizeChanged: LegendListProps<TItem>['onItemSizeChanged'] = info => {
        publish();
        props.onItemSizeChanged?.(info);
    };
    const handleViewableItemsChanged: LegendListProps<TItem>['onViewableItemsChanged'] = info => {
        publish();
        props.onViewableItemsChanged?.(info);
    };

    return (
        <AnimatedLegendList
            {...props}
            {...scrollProps}
            data={data}
            renderItem={renderItem}
            stickyHeaderConfig={stickyHeaderConfig}
            onMetricsChange={handleMetricsChange}
            onItemSizeChanged={handleItemSizeChanged}
            onViewableItemsChanged={handleViewableItemsChanged}
            ListHeaderComponent={ListHeaderComponent}
            extraData={extraData ?? renderItem}
            ref={handleListRef}
            refScrollView={refScrollView}
            maintainVisibleContentPosition={MAINTAIN_VISIBLE_CONTENT_POSITION}
            recycleItems
            showsVerticalScrollIndicator={false}
        />
    );
};
