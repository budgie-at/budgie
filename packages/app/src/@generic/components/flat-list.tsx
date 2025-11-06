import { ComponentProps } from 'react';
import { FlatListProps, FlatList as RnFlatList, View } from 'react-native';

import { isNotEmptyArray } from '@rnw-community/shared';

import { mapToFlatListData } from '../map-to-flatlist-data.util';

import type { ListRenderItem } from '@react-native/virtualized-lists';

export const FlatList = <T = unknown,>({ data, renderItem, ...rest }: FlatListProps<T>) => {
    const items = isNotEmptyArray(data) ? mapToFlatListData(data) : [];

    const handleRenderItem: ComponentProps<typeof RnFlatList>['renderItem'] = (args: Flat) => (args.item ? <View className="flex-1" /> : renderItem(args));

    return (
        <RnFlatList
            columnWrapperClassName="gap-x-[10px]"
            contentContainerClassName="gap-y-[10px]"
            data={items}
            renderItem={handleRenderItem}
            showsVerticalScrollIndicator={false}
            {...rest}
        />
    );
};
