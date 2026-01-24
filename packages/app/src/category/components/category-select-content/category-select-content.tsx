import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emptyFn, isNotEmptyArray } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly data: FlatListDataItem<CategoryEntityInterface>[];
    readonly variant: ColorPaletteVariant;
    readonly initialCategoryId: number | null;
    readonly onSelect: (categoryId: number) => void;
}

const NUM_COLUMNS = 3;
const HEADER_HEIGHT = { paddingTop: 88 };

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

export const CategorySelectContent = (props: Props) => {
    const { data, variant, initialCategoryId, onSelect } = props;
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();

    const isEmpty = !isNotEmptyArray(data);
    const flatListStyle = { flex: 1 };
    const contentContainerStyle = [{ paddingBottom: bottom }, HEADER_HEIGHT];

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
                isSelected={item.id === initialCategoryId}
                onSelect={onSelect}
                title={item.title}
                variant={variant}
                icon={item.icon}
                id={item.id}
            />
        );

    if (isEmpty) {
        return (
            <View className="flex-1" style={HEADER_HEIGHT}>
                <EmptyState title={t`No categories found`} description={t`Try a different search term`} />
            </View>
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
            contentContainerClassName="px-xl"
            contentContainerStyle={contentContainerStyle}
        />
    );
};
