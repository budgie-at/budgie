import { ReactElement } from 'react';
import { FlatList, ListRenderItem, ViewStyle } from 'react-native';

import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
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
const WINDOW_SIZE = 5;

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
    const contentContainerStyle = useFormsheetListContentStyle(additionalBottomPadding, topOffset);
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
            className="absolute inset-0 bg-primary-reverse"
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            numColumns={NUM_COLUMNS}
            windowSize={WINDOW_SIZE}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            columnWrapperClassName="gap-x-lg"
            contentContainerStyle={alignedContentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
