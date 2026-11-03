import { ReactElement } from 'react';

import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { SelectorList } from '../selector-list/selector-list';

import type { LegendListRenderItemProps } from '@legendapp/list/react-native';

interface Props<Item> {
    readonly data: Item[];
    readonly itemHeight: number;
    readonly renderItem: (info: LegendListRenderItemProps<Item>) => ReactElement;
    readonly keyExtractor: (item: Item, index: number) => string;
    readonly listEmptyComponent: ReactElement;
    readonly isLoading?: boolean;
    readonly additionalBottomPadding?: number;
}

const NUM_COLUMNS = 3;
const ROW_GAP = 8;
const COLUMN_GAP = 8;
const COLUMN_WRAPPER_STYLE = { rowGap: ROW_GAP, columnGap: COLUMN_GAP };

export const SelectorGridContent = <Item,>(props: Props<Item>) => {
    const { data, itemHeight, renderItem, keyExtractor, listEmptyComponent, isLoading = false, additionalBottomPadding = 0 } = props;
    const contentContainerStyle = useFormsheetListContentStyle(additionalBottomPadding);

    const estimatedItemSize = itemHeight + ROW_GAP;

    const listOptions = {
        numColumns: NUM_COLUMNS,
        estimatedItemSize,
        columnWrapperStyle: COLUMN_WRAPPER_STYLE,
        contentContainerStyle,
        ListEmptyComponent: listEmptyComponent
    };

    return <SelectorList isLoading={isLoading} data={data} keyExtractor={keyExtractor} renderItem={renderItem} options={listOptions} />;
};
