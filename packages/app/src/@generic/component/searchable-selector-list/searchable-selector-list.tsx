import { FlatList, View } from 'react-native';

import { useFormsheetListStyles } from '../../hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { ListItemSeparator } from '../list-item-separator/list-item-separator';
import { SelectorModalSearchHeader } from '../selector-modal-search-header/selector-modal-search-header';

import type { ReactElement } from 'react';

interface Props<T> {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly searchPlaceholder: string;
    readonly searchTestID?: string;
    readonly data: T[];
    readonly keyExtractor: (item: T) => string;
    readonly renderItem: (info: { item: T }) => ReactElement;
    readonly emptyState: ReactElement;
}

export const SearchableSelectorList = <T,>(props: Props<T>) => {
    const { search, onSearchChange, searchPlaceholder, searchTestID, data, keyExtractor, renderItem, emptyState } = props;
    const { flatListStyle, contentContainerStyle, backgroundColor } = useFormsheetListStyles();
    const containerStyle = { flex: 1, backgroundColor };

    return (
        <View style={containerStyle}>
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={onSearchChange}
                placeholder={searchPlaceholder}
                testID={searchTestID}
            />

            <FlatList
                style={flatListStyle}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={contentContainerStyle}
                ItemSeparatorComponent={ListItemSeparator}
                ListEmptyComponent={<View className="flex-1 justify-center">{emptyState}</View>}
            />
        </View>
    );
};
