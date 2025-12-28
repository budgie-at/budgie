import { MessageDescriptor } from '@lingui/core';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheetInterface } from '../../interface/bottom-sheet.interface';
import { SearchableListBottomSheet } from '../bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { SelectorCard } from '../selector-card/selector-card';

interface Item {
    readonly emoji: string;
    readonly name: MessageDescriptor;
}

interface Props<T extends string, TItem extends Item> {
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedValue: T;
    readonly onSelect: (value: T) => void;
    readonly data: readonly TItem[];
    readonly title: string;
    readonly description: string;
    readonly searchPlaceholder: string;
    readonly emptyTitle: string;
    readonly emptyDescription: string;
    readonly getItemKey: (item: TItem) => T;
    readonly getItemCode: (item: TItem) => string;
    readonly index?: number;
}

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

export const SearchableSelectorBottomSheet = <T extends string, TItem extends Item>({
    ref,
    selectedValue,
    onSelect,
    data,
    title,
    description,
    searchPlaceholder,
    emptyTitle,
    emptyDescription,
    getItemKey,
    getItemCode,
    index
}: Props<T, TItem>) => {
    const [search, setSearch] = useState('');
    const { i18n } = useLingui();

    const filteredData = data.filter(
        item =>
            i18n.t(item.name).toLowerCase().includes(search.toLowerCase()) || getItemCode(item).toLowerCase().includes(search.toLowerCase())
    );

    const handleSelect = (value: T) => {
        onSelect(value);
        ref.current?.close();
    };

    const keyExtractor = (item: TItem) => getItemKey(item);

    const renderItem = ({ item }: { item: TItem }) => {
        const itemKey = getItemKey(item);

        return (
            <SelectorCard
                identifier={itemKey}
                isSelected={itemKey === selectedValue}
                onSelect={handleSelect}
                iconSlot={
                    <View className="w-12 h-12 bg-secondary-background rounded-5xl items-center justify-center">
                        <Text className="text-primary text-4xl">{item.emoji}</Text>
                    </View>
                }
                title={<Text className="text-primary font-medium text-md">{i18n.t(item.name)}</Text>}
                subtitle={<Text className="text-sm text-secondary-foreground">{getItemCode(item)}</Text>}
            />
        );
    };

    return (
        <SearchableListBottomSheet
            index={index}
            ref={ref}
            title={title}
            description={description}
            onSearchChange={setSearch}
            searchPlaceholder={searchPlaceholder}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={emptyDescription}
            emptyTitle={emptyTitle}
            data={filteredData}
            flatListProps={flatListProps}
        />
    );
};
