import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, View, ViewStyle } from 'react-native';

import { emptyFn, isDefined } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { SelectorGridSkeleton } from '../../../@generic/component/selector-grid-skeleton/selector-grid-skeleton';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly data: FlatListDataItem<CategoryEntityInterface>[];
    readonly variant: ColorPaletteVariant;
    readonly initialCategoryId: number | null;
    readonly selectedCategoryIds?: number[];
    readonly isLoading?: boolean;
    readonly alignToBottom?: boolean;
    readonly additionalBottomPadding?: number;
    readonly topOffset?: number;
    readonly onSelect: (categoryId: number) => void;
    readonly cardTestID?: (title: string) => string;
}

const NUM_COLUMNS = 3;
const CARD_HEIGHT = 72;

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

const getSelectedCategoryIds = (initialCategoryId: number | null, selectedCategoryIds?: number[]): number[] => {
    if (isDefined(selectedCategoryIds)) {
        return selectedCategoryIds;
    }

    return isDefined(initialCategoryId) ? [initialCategoryId] : [];
};

export const CategorySelectContent = (props: Props) => {
    const {
        data,
        variant,
        initialCategoryId,
        selectedCategoryIds,
        isLoading = false,
        alignToBottom = false,
        additionalBottomPadding = 0,
        topOffset,
        onSelect,
        cardTestID
    } = props;
    const { t } = useLingui();
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles(additionalBottomPadding, topOffset);
    const resolvedSelectedCategoryIds = getSelectedCategoryIds(initialCategoryId, selectedCategoryIds);
    const alignedContentContainerStyle: ViewStyle = {
        ...contentContainerStyle,
        ...(alignToBottom && { justifyContent: 'flex-end' })
    };

    const renderItem = ({ item }: { item: FlatListDataItem<CategoryEntityInterface> }) =>
        item.isEmpty ? (
            <CategorySelectorCard
                className="opacity-0"
                isSelected={false}
                onSelect={emptyFn}
                title=""
                variant={variant}
                icon={UserIconNameEnum.Circle}
                id={0}
            />
        ) : (
            <CategorySelectorCard
                isSelected={resolvedSelectedCategoryIds.includes(item.id)}
                onSelect={onSelect}
                title={item.title}
                variant={variant}
                icon={item.icon}
                id={item.id}
                testID={cardTestID?.(item.title)}
            />
        );

    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState title={t`No categories found`} description={t`Try a different search term`} />
        </View>
    );

    if (isLoading) {
        return (
            <SelectorGridSkeleton
                itemHeight={CARD_HEIGHT}
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
            columnWrapperClassName="gap-x-lg mb-lg"
            contentContainerStyle={alignedContentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
