import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, View } from 'react-native';

import { emptyFn } from '@rnw-community/shared';

import { CategoryPickerBottomSheetSelectors } from '../../../@e2e/selectors/category-picker-bottom-sheet.selector';
import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { useFormsheetListStyles } from '../../../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly data: FlatListDataItem<CategoryEntityInterface>[];
    readonly variant: ColorPaletteVariant;
    readonly initialCategoryId: number | null;
    readonly onSelect: (categoryId: number) => void;
    readonly cardTestID?: (title: string) => string;
}

const NUM_COLUMNS = 3;

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

export const CategorySelectContent = (props: Props) => {
    const { data, variant, initialCategoryId, onSelect, cardTestID } = props;
    const { t } = useLingui();
    const { flatListStyle, contentContainerStyle } = useFormsheetListStyles();

    const renderItem = ({ item, index }: { item: FlatListDataItem<CategoryEntityInterface>; index: number }) =>
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
                isSelected={item.id === initialCategoryId}
                onSelect={onSelect}
                title={item.title}
                variant={variant}
                icon={item.icon}
                id={item.id}
                testID={cardTestID?.(item.title) ?? CategoryPickerBottomSheetSelectors.Card(index)}
            />
        );

    const listEmptyComponent = (
        <View className="flex-1 justify-center">
            <EmptyState title={t`No categories found`} description={t`Try a different search term`} />
        </View>
    );

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
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
