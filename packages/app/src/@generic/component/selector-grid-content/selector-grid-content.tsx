import { ReactElement } from 'react';
import { View } from 'react-native';

import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { SelectorGridSkeleton } from '../selector-grid-skeleton/selector-grid-skeleton';

import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props<Item> {
    readonly data: Item[];
    readonly itemHeight: number;
    readonly renderItem: (info: LegendListRenderItemProps<Item>) => ReactElement;
    readonly keyExtractor: (item: Item, index: number) => string;
    readonly listEmptyComponent: ReactElement;
    readonly isLoading?: boolean;
    readonly additionalBottomPadding?: number;
    readonly topOffset?: number;
}

const NUM_COLUMNS = 3;
const ROW_GAP = 8;
const COLUMN_GAP = 8;
const COLUMN_WRAPPER_STYLE = { rowGap: ROW_GAP, columnGap: COLUMN_GAP };

export const SelectorGridContent = <Item,>(props: Props<Item>) => {
    const {
        data,
        itemHeight,
        renderItem,
        keyExtractor,
        listEmptyComponent,
        isLoading = false,
        additionalBottomPadding = 0,
        topOffset
    } = props;
    const contentContainerStyle = useFormsheetListContentStyle(additionalBottomPadding, topOffset, COLUMN_GAP);

    const estimatedItemSize = itemHeight + ROW_GAP;

    if (isLoading) {
        return <SelectorGridSkeleton itemHeight={itemHeight} additionalBottomPadding={additionalBottomPadding} topOffset={topOffset} />;
    }

    return (
        <View className="absolute inset-0">
            <BudgieLegendList
                style={LEGEND_LIST_STYLE}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                numColumns={NUM_COLUMNS}
                estimatedItemSize={estimatedItemSize}
                keyboardShouldPersistTaps="handled"
                columnWrapperStyle={COLUMN_WRAPPER_STYLE}
                contentContainerStyle={contentContainerStyle}
                ListEmptyComponent={listEmptyComponent}
            />
        </View>
    );
};
