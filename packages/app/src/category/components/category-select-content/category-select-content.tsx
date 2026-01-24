import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { FlatList, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { emptyFn } from '@rnw-community/shared';

import { EmptyState } from '../../../@generic/component/empty-state/empty-state';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem } from '../../../@generic/utils/map-to-flatlist-data.util';
import { useThemeContext } from '../../../theme/context/theme.context';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly data: FlatListDataItem<CategoryEntityInterface>[];
    readonly variant: ColorPaletteVariant;
    readonly initialCategoryId: number | null;
    readonly onSelect: (categoryId: number) => void;
}

const NUM_COLUMNS = 3;
const HEADER_OFFSET = 88;
const BG_LIGHT = '#FFFFFF';
const BG_DARK = '#000000';

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

export const CategorySelectContent = (props: Props) => {
    const { data, variant, initialCategoryId, onSelect } = props;
    const { t } = useLingui();
    const { bottom } = useSafeAreaInsets();
    const { isDarkColorSchema } = useThemeContext();

    const backgroundColor = isDarkColorSchema ? BG_DARK : BG_LIGHT;
    const flatListStyle = [StyleSheet.absoluteFill, { backgroundColor }];
    const contentContainerStyle = { paddingTop: HEADER_OFFSET, paddingBottom: bottom, flexGrow: 1 };

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
            contentContainerClassName="px-xl"
            contentContainerStyle={contentContainerStyle}
            ListEmptyComponent={listEmptyComponent}
        />
    );
};
