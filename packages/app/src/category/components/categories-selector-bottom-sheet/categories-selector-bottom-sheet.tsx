/* jscpd:ignore-start */
import { CategoryEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { BottomSheetFooterProps } from '@gorhom/bottom-sheet';
import { useLingui } from '@lingui/react/macro';
import { FC, RefObject, useState } from 'react';

import { emptyFn } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { MultiSelectFooter } from '../../../@generic/component/multi-select-footer/multi-select-footer';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { ColorPaletteVariant } from '../../../@generic/type/color-palette-variant.type';
import { FlatListDataItem, padFlatListData } from '../../../@generic/utils/map-to-flatlist-data.util';
import { sortSelectedFirst } from '../../../@generic/utils/sort-selected-first.util';
import { useSearchCategoriesQuery } from '../../query/use-search-categories.query';
import { CategorySelectorCard } from '../category-selector-card/category-selector-card';

interface Props {
    readonly selectedCategoryIds: number[];
    readonly onSelect: (categoryId: number) => void;
    readonly onClear: () => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly variant?: ColorPaletteVariant;
}

const keyExtractor = (item: FlatListDataItem<CategoryEntityInterface>, index: number) =>
    item.isEmpty ? `empty-${index}` : item.id.toString();

const flatListProps = {
    numColumns: 3,
    columnWrapperClassName: 'gap-x-lg',
    contentContainerClassName: 'gap-y-lg px-3 pt-xl'
};

export const CategoriesSelectorBottomSheet = (props: Props) => {
    const { ref, selectedCategoryIds, onSelect, onClear, variant = 'ghost' } = props;

    const [search, setSearch] = useState('');
    const { categories } = useSearchCategoriesQuery(search, true);
    const { t } = useLingui();

    const sortedCategories = sortSelectedFirst(categories ?? [], selectedCategoryIds);
    const data = padFlatListData(sortedCategories, 3);

    const handleClose = () => void ref.current?.close();

    const handleEmptySelect = emptyFn;
    const renderItem = ({ item }: { item: FlatListDataItem<CategoryEntityInterface> }) =>
        item.isEmpty ? (
            <CategorySelectorCard
                className="opacity-0"
                isSelected={false}
                onSelect={handleEmptySelect}
                title=""
                variant={variant}
                icon={UserIconNameEnum.Circle}
                id={0}
            />
        ) : (
            <CategorySelectorCard
                isSelected={selectedCategoryIds.includes(item.id)}
                onSelect={onSelect}
                title={item.title}
                variant={variant}
                icon={item.icon}
                id={item.id}
            />
        );

    const footerComponent: FC<BottomSheetFooterProps> = footerProps => (
        <MultiSelectFooter {...footerProps} selectedCount={selectedCategoryIds.length} onClose={handleClose} onClear={onClear} />
    );

    return (
        <SearchableListBottomSheet
            ref={ref}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search categories...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={t`Try a different search term`}
            emptyIcon={UserIconNameEnum.Tag}
            emptyTitle={t`No categories found`}
            data={data}
            flatListProps={flatListProps}
            footerComponent={footerComponent}
        />
    );
};
/* jscpd:ignore-end */
