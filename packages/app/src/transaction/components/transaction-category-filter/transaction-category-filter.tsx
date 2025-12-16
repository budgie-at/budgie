import { CategoryEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isPositiveNumber } from '@rnw-community/shared';

import { useSearchCategoriesQuery } from '../../../category/query/use-search-categories.query';
import { useTransactionFilter } from '../../hook/use-transaction-filter.hook';
import { TransactionFilterRenderItemsArgsInterface } from '../../interface/transaction-filter-render-items-args.interface';
import { TransactionBaseSearchableFilter } from '../transaction-base-filter/transaction-base-searchable-filter';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';
import { TransactionFilterEmptyState } from '../transaction-filter-empty-state/transaction-filter-empty-state';

import { TransactionCategoryFilterItem } from './transaction-category-filter-item';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionCategoryFilter = ({ value, onChange }: Props) => {
    const { ref, search, setSearch, handleOpen, handleNavigateToCreate } = useTransactionFilter('/settings/categories', value);
    const { t } = useLingui();

    const { categories, total } = useSearchCategoriesQuery(search, true);

    const selectedCategoriesCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedCategoriesCount) ? t`Categories (${selectedCategoriesCount})` : t`Categories`;

    const renderItems = ({ items, onSelect, selectedIds }: TransactionFilterRenderItemsArgsInterface<CategoryEntityInterface>) => (
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
            <TransactionFilterChip isActive={isPositiveNumber(selectedCategoriesCount)} icon="Tag" label={label} onPress={handleOpen} />

            <TransactionBaseSearchableFilter
                ref={ref}
                value={value}
                onChange={onChange}
                search={search}
                onSearchChange={setSearch}
                icon="Tag"
                total={total}
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
                        onCreate={handleNavigateToCreate}
                        description={t`Create custom categories in Settings to label and filter your transactions`}
                    />
                }
            />
        </>
    );
};
