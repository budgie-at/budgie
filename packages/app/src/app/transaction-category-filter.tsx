/* jscpd:ignore-start */
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useStateRef } from '../@generic/hook/use-state-ref/use-state-ref.hook';
import { useSearchCategoriesQuery } from '../category/query/use-search-categories.query';
/* jscpd:ignore-end */
import { SearchableFilterControls } from '../transaction/components/searchable-filter-controls/searchable-filter-controls';
import { SearchableFilterEmptyResult } from '../transaction/components/searchable-filter-empty-result/searchable-filter-empty-result';
import { SearchableFilterFooter } from '../transaction/components/searchable-filter-footer/searchable-filter-footer';
import { TransactionCategoryFilterItem } from '../transaction/components/transaction-category-filter/transaction-category-filter-item';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { TransactionFilterHeader } from '../transaction/components/transaction-filter-header/transaction-filter-header';
import { useTransactionCategoryFilterModal } from '../transaction/context/transaction-category-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

// eslint-disable-next-line max-statements -- Form orchestration component with multiple hooks and handlers
export default function TransactionCategoryFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    const [, resolveTransactionCategoryFilter, currentParams] = useTransactionCategoryFilterModal();
    const { backgroundColor } = useFormsheetListStyles();

    const [localValue, setLocalValue, localValueRef] = useStateRef<number[] | null>(() => currentParams?.value ?? null);
    const [search, setSearch] = useState('');

    const { categories, total } = useSearchCategoriesQuery(search, true);

    const localSelectedCount = localValue?.length ?? 0;
    const containerStyle = { flex: 1, backgroundColor };
    const items = categories ?? [];
    const showControls = !(isEmptyArray(items) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);

    /* jscpd:ignore-start */
    const handleSelect = (selected: number) => {
        setLocalValue(prev => toggleFilterSelection(prev, [selected]));
    };

    const handleSelectAll = () => void setLocalValue(items.map(item => item.id));
    const handleDeselectAll = () => void setLocalValue(null);
    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveTransactionCategoryFilter({ value: localValueRef.current });
    };
    /* jscpd:ignore-end */

    const handleNavigateToCreate = () => {
        resolveTransactionCategoryFilter(null, { skipBack: true });
        router.dismiss();
        router.push('/settings/categories');
    };

    return (
        <View style={containerStyle}>
            <TransactionFilterHeader
                title={t`Categories`}
                icon={UserIconNameEnum.Tag}
                onClear={handleClear}
                showClear={isPositiveNumber(localSelectedCount)}
            />

            <ScrollView contentContainerClassName="py-[40px] px-7xl gap-y-3xl">
                <SearchableFilterControls
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search categories...`}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    isVisible={showControls}
                    searchInputTestID={TransactionFiltersSelectors.CategorySearchInput}
                    selectAllButtonTestID={TransactionFiltersSelectors.CategorySelectAllButton}
                    deselectAllButtonTestID={TransactionFiltersSelectors.CategoryDeselectAllButton}
                />

                {isNotEmptyArray(items) ? (
                    <View className="gap-y-3xl">
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

                {/* jscpd:ignore-start */}
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
            </ScrollView>

            <SearchableFilterFooter
                selectedCount={localSelectedCount}
                onApply={handleApply}
                applyButtonTestID={TransactionFiltersSelectors.CategoryApplyButton}
            />
        </View>
    );
    /* jscpd:ignore-end */
}
