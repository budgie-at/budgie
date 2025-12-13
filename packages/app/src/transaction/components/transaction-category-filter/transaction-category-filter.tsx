import { CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { FilterChip } from '../../../@generic/components/filter-chip/filter-chip';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { TransactionFilterRenderItemsArgsType } from '../../type/transaction-filter-render-items-args.type';
import { TransactionCategoryFilterItem } from './transaction-category-filter-item';

import { TransactionMultiSelectFilter } from '../transaction-base-filter/transaction-base-filter';
import { TransactionFilterEmptyState } from '../transaction-filter-empty-state/transaction-filter-empty-state';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionCategoryFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');
    const { t } = useLingui();

    const { categories } = useSearchCategoriesQuery(search, true);

    const selectedCategoriesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedCategoriesCount) ? t`Categories (${selectedCategoriesCount})` : t`Categories`;

    const handleOpen = () => void ref.current?.open();

    const handleNavigateToCategories = () => {
        ref.current?.close();
        void router.push('/categories');
    };

    const renderItems = ({ items, onSelect, selectedIds }: TransactionFilterRenderItemsArgsType<CategoryEntityInterface>) => (
        <View className="gap-y-3xl">
            {items.map(category => (
                <TransactionCategoryFilterItem
                    isSelected={selectedIds.includes(category.id)}
                    category={category}
                    key={category.id}
                    onSelect={onSelect}
                />
            ))}
        </View>
    );

    return (
        <>
            <FilterChip isActive={isPositiveNumber(selectedCategoriesCount)} icon="Tag" label={label} onPress={handleOpen} />

            <TransactionMultiSelectFilter
                ref={ref}
                value={value}
                onChange={onChange}
                search={search}
                onSearchChange={setSearch}
                icon="Tag"
                title={t`Categories`}
                items={categories ?? []}
                renderItems={renderItems}
                emptySearchText={t`No categories found`}
                searchPlaceholder={t`Search categories...`}
                emptyState={
                    <TransactionFilterEmptyState
                        icon="Tag"
                        title={t`No Categories Yet`}
                        buttonText={t`Create Categories`}
                        onCreate={handleNavigateToCategories}
                        description={t`Create custom categories in Settings to label and filter your transactions`}
                    />
                }
            />
        </>
    );
};
