import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { SelectorGridContent } from '../../../@generic/component/selector-grid-content/selector-grid-content';
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

const CARD_HEIGHT = 92;

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

export const CategorySelectContent = (props: Props) => {
    const { data, variant, selectedCategoryIds, additionalBottomPadding = 0, isLoading = false, onSelect, cardTestID } = props;
    const { t } = useLingui();

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

    return (
        <SelectorGridContent
            data={data}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            itemHeight={CARD_HEIGHT}
            listEmptyComponent={listEmptyComponent}
            isLoading={isLoading}
            additionalBottomPadding={additionalBottomPadding}
        />
    );
};
