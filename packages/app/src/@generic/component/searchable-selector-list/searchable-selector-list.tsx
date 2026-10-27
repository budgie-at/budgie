import { View } from 'react-native';

import { LEGEND_LIST_STYLE } from '../../constant/legend-list.constant';
import { useFormsheetListContentStyle } from '../../hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { BudgieLegendList } from '../budgie-legend-list/budgie-legend-list';
import { ListItemSeparator } from '../list-item-separator/list-item-separator';
import { SelectorModalSearchHeader } from '../selector-modal-search-header/selector-modal-search-header';

import type { LegendListRenderItemProps } from '@legendapp/list/react-native';
import type { ReactElement } from 'react';

interface Props<T> {
    readonly search: string;
    readonly onSearchChange: (value: string) => void;
    readonly searchPlaceholder: string;
    readonly searchTestID?: string;
    readonly data: T[];
    readonly keyExtractor: (item: T) => string;
    readonly renderItem: (info: LegendListRenderItemProps<T>) => ReactElement;
    readonly emptyState: ReactElement;
}

export const SearchableSelectorList = <T,>(props: Props<T>) => {
    const { search, onSearchChange, searchPlaceholder, searchTestID, data, keyExtractor, renderItem, emptyState } = props;
    const contentContainerStyle = useFormsheetListContentStyle();

    return (
        <View className="flex-1 bg-primary-reverse">
            <SelectorModalSearchHeader
                search={search}
                onSearchChange={onSearchChange}
                placeholder={searchPlaceholder}
                testID={searchTestID}
            />

            <View className="absolute inset-0 bg-primary-reverse">
                <BudgieLegendList
                    style={LEGEND_LIST_STYLE}
                    data={data}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={contentContainerStyle}
                    ItemSeparatorComponent={ListItemSeparator}
                    ListEmptyComponent={<View className="flex-1 justify-center">{emptyState}</View>}
                />
            </View>
        </View>
    );
};
