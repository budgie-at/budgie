import { useWindowDimensions } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { isPositiveNumber } from '@rnw-community/shared';

import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { LoadingContent } from '../loading-content/loading-content';
import { SelectorScrollEdge } from '../selector-scroll-edge/selector-scroll-edge';

import type { LegendListProps, LegendListRef } from '@legendapp/list/react-native';
import type { ReactNode, Ref } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

interface Props<Item> {
    readonly data: LegendListProps<Item>['data'];
    readonly renderItem: LegendListProps<Item>['renderItem'];
    readonly keyExtractor: LegendListProps<Item>['keyExtractor'];
    readonly options: Omit<
        LegendListProps<Item>,
        | 'data'
        | 'renderItem'
        | 'keyExtractor'
        | 'style'
        | 'keyboardDismissMode'
        | 'keyboardShouldPersistTaps'
        | 'onScroll'
        | 'scrollEventThrottle'
        | 'initialScrollIndex'
    >;
    readonly listRef?: Ref<LegendListRef>;
    readonly children?: ReactNode;
    readonly isLoading?: boolean;
    readonly selectedIndex?: number;
}

export const SelectorList = <Item,>({
    data,
    renderItem,
    keyExtractor,
    options,
    listRef,
    children,
    isLoading = false,
    selectedIndex = 0
}: Props<Item>) => {
    const { fontScale } = useWindowDimensions();
    const scrollOffset = useSharedValue(0);
    const columns = options.numColumns ?? 1;
    const initialScrollIndex = Math.max(0, Math.floor(selectedIndex / columns) - 2) * columns;
    const estimatedItemSize = options.estimatedItemSize ?? 60 * Math.min(fontScale, 2);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        scrollOffset.set(event.nativeEvent.contentOffset.y);
    };

    return (
        <LoadingContent isLoading={isLoading} containerClassName="flex-1" className="flex-1">
            <BudgieLegendList
                {...options}
                {...(isPositiveNumber(initialScrollIndex) && { initialScrollIndex })}
                estimatedItemSize={estimatedItemSize}
                ref={listRef}
                data={data}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                style={LEGEND_LIST_STYLE}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                scrollEventThrottle={16}
            />
            <SelectorScrollEdge scrollOffset={scrollOffset} />
            {children}
        </LoadingContent>
    );
};
