import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { SelectorList } from '../../../@generic/component/selector-list/selector-list';
import { useFormsheetListContentStyle } from '../../../@generic/hook/use-formsheet-list-content-style/use-formsheet-list-content-style.hook';
import { useIsAccessibilityTextSize } from '../../../@generic/hook/use-is-accessibility-text-size.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

import type { ReactElement } from 'react';

interface Props {
    readonly listEmptyComponent?: ReactElement;
    readonly data: FlatListDataItem<CategoryEntityInterface>[];
    readonly variant: ColorPaletteVariant;
    readonly selectedCategoryIds: number[];
    readonly additionalBottomPadding?: number;
    readonly isLoading?: boolean;
    readonly onSelect: (categoryId: number) => void;
    readonly cardTestID?: (title: string) => string;
}

const COLUMN_WRAPPER_STYLE = { rowGap: 8, columnGap: 8 };

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

export const CategorySelectContent = (props: Props) => {
    const { data, variant, selectedCategoryIds, additionalBottomPadding = 0, isLoading = false, onSelect, cardTestID } = props;
    const { t } = useLingui();
    const largeText = useIsAccessibilityTextSize();
    const columns = largeText ? 1 : 3;
    const visibleData = largeText ? data.filter(item => !item.isEmpty) : data;
    const contentContainerStyle = useFormsheetListContentStyle(additionalBottomPadding);

    const renderItem = ({ item }: { item: FlatListDataItem<CategoryEntityInterface> }) =>
        item.isEmpty ? (
            <View className="flex-1" />
        ) : (
            <CategorySelectorCard
                isSelected={selectedCategoryIds.includes(item.id)}
                onSelect={onSelect}
                title={item.title}
                variant={variant}
                icon={item.icon}
                id={item.id}
                testID={cardTestID?.(item.title)}
            />
        );

    const listEmptyComponent = props.listEmptyComponent ?? (
        <View className="pt-7xl">
            <EmptyState icon={UserIconNameEnum.Search} title={t`No categories found`} description={t`Create a category to get started.`} />
        </View>
    );

    const listOptions = {
        numColumns: columns,
        estimatedItemSize: 100,
        ...(!largeText && { columnWrapperStyle: COLUMN_WRAPPER_STYLE }),
        contentContainerStyle,
        ListEmptyComponent: listEmptyComponent
    };

    return (
        <SelectorList
            key={columns}
            isLoading={isLoading}
            data={visibleData}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            options={listOptions}
        />
    );
};
