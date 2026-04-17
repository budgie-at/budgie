/* jscpd:ignore-start */
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FilterSheetList } from '../@generic/component/filter-sheet/filter-sheet-list/filter-sheet-list';
import { FilterSheetSearchableDrawer } from '../@generic/component/filter-sheet/filter-sheet-searchable-drawer/filter-sheet-searchable-drawer';
import { useSearchableFilterState } from '../@generic/hook/use-searchable-filter-state/use-searchable-filter-state.hook';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';
import { SearchableFilterEmptyResult } from '../transaction/components/searchable-filter-empty-result/searchable-filter-empty-result';
import { TransactionCategoryFilterItem } from '../transaction/components/transaction-category-filter/transaction-category-filter-item';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { useTransactionCategoryFilterModal } from '../transaction/context/transaction-category-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

// eslint-disable-next-line max-statements -- Filter modal orchestrates multiple hooks, handlers, and label derivation
export default function TransactionCategoryFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    const [, resolveTransactionCategoryFilter, currentParams] = useTransactionCategoryFilterModal();

    const state = useSearchableFilterState(currentParams?.value ?? null);
    const { localValue, setLocalValue, localValueRef, search, setSearch, selectedCount, handleDeselectAll } = state;

    const { categories, total } = useSearchCategoriesQuery(search, true);

    const items = categories ?? [];
    const showControls = !(isEmptyArray(items) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);

    const handleSelect = (selected: number) => void setLocalValue(prev => toggleFilterSelection(prev, [selected]));
    const handleSelectAll = () => void setLocalValue(() => items.map(item => item.id));
    const handleApply = () => void resolveTransactionCategoryFilter({ value: localValueRef.current });

    const handleNavigateToCreate = () => {
        resolveTransactionCategoryFilter(null, { skipBack: true });
        router.dismiss();
        router.push('/settings/categories');
    };

    const buildApplyLabel = () => {
        if (selectedCount === 0) {
            return t`Show all categories`;
        }
        if (selectedCount === 1) {
            return t`Show 1 category`;
        }

        return t`Show ${selectedCount} categories`;
    };
    const applyLabel = buildApplyLabel();

    return (
        <FilterSheet>
            <FilterSheetList alignToBottom={isNotEmptyString(search)}>
                {isNotEmptyArray(items) ? (
                    <View className="gap-y-sm">
                        {items.map(category => (
                            <TransactionCategoryFilterItem
                                isSelected={localValue?.includes(category.id) ?? false}
                                category={category}
                                key={category.id}
                                onSelect={handleSelect}
                            />
                        ))}
                    </View>
                ) : null}

                {isEmptyArray(items) && showEmptySearch ? (
                    <SearchableFilterEmptyResult>
                        <Trans>No categories found</Trans>
                    </SearchableFilterEmptyResult>
                ) : null}

                {isEmptyArray(items) && !showEmptySearch ? (
                    <TransactionFilterEmptyState
                        icon={UserIconNameEnum.Tag}
                        title={t`No Categories Yet`}
                        buttonText={t`Create Categories`}
                        onCreate={handleNavigateToCreate}
                        description={t`Create custom categories in Settings to label and filter your transactions`}
                    />
                ) : null}
            </FilterSheetList>

            <FilterSheetSearchableDrawer
                showControls={showControls}
                searchValue={search}
                searchPlaceholder={t`Search categories...`}
                onSearchChange={setSearch}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onApply={handleApply}
                applyLabel={applyLabel}
                selectedCount={selectedCount}
                searchTestID={TransactionFiltersSelectors.CategorySearchInput}
                selectAllTestID={TransactionFiltersSelectors.CategorySelectAllButton}
                deselectAllTestID={TransactionFiltersSelectors.CategoryDeselectAllButton}
                applyTestID={TransactionFiltersSelectors.CategoryApplyButton}
            />
        </FilterSheet>
    );
}
/* jscpd:ignore-end */
