import { ReactElement } from 'react';
import { FlatList, ListRenderItem, ViewStyle } from 'react-native';

import { useFormsheetListStyles } from '../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { SelectorGridSkeleton } from '../selector-grid-skeleton/selector-grid-skeleton';

interface Props<Item> {
    readonly data: Item[];
    readonly itemHeight: number;
    readonly renderItem: ListRenderItem<Item>;
    readonly keyExtractor: (item: Item, index: number) => string;
    readonly listEmptyComponent: ReactElement;
    readonly isLoading?: boolean;
    readonly alignToBottom?: boolean;
    readonly additionalBottomPadding?: number;
    readonly topOffset?: number;
}

const NUM_COLUMNS = 3;
const ROW_GAP = 8;

export const SelectorGridContent = <Item,>(props: Props<Item>) => {
    const {
        data,
        itemHeight,
        renderItem,
        keyExtractor,
        listEmptyComponent,
        isLoading = false,
        alignToBottom = false,
        additionalBottomPadding = 0,
        topOffset
    } = props;
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles(additionalBottomPadding, topOffset);
    const alignedContentContainerStyle: ViewStyle = {
        ...contentContainerStyle,
        rowGap: ROW_GAP,
        ...(alignToBottom && { justifyContent: 'flex-end' })
    };

    if (isLoading) {
        return (
            <SelectorGridSkeleton
                itemHeight={itemHeight}
                additionalBottomPadding={additionalBottomPadding}
                topOffset={topOffset}
                alignToBottom={alignToBottom}
            />
        );
    }

    return (
        <FlatList
            style={flatListStyle}
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={NUM_COLUMNS}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            columnWrapperClassName="gap-x-lg"
            contentContainerStyle={alignedContentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
