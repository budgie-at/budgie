import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { useSheetScrollEdge } from '../../hook/use-sheet-scroll-edge/use-sheet-scroll-edge.hook';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { LoadingContent } from '../loading-content/loading-content';
import { SelectorScrollEdge } from '../selector-scroll-edge/selector-scroll-edge';

import type { LegendListProps, LegendListRef } from '@legendapp/list/react-native';
import type { ReactNode, Ref } from 'react';

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
    >;
    readonly listRef?: Ref<LegendListRef>;
    readonly children?: ReactNode;
    readonly isLoading?: boolean;
}

export const SelectorList = <Item,>({ data, renderItem, keyExtractor, options, listRef, children, isLoading = false }: Props<Item>) => {
    const { scrollOffset, handleScroll } = useSheetScrollEdge();

    return (
        <LoadingContent isLoading={isLoading} containerClassName="flex-1" className="flex-1">
            <BudgieLegendList
                {...options}
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
            <SelectorScrollEdge scrollOffset={scrollOffset} top={0} />
            {children}
        </LoadingContent>
    );
};
