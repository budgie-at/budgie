/* jscpd:ignore-start */
import { UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { FilterSheetList } from '../@generic/component/filter-sheet/filter-sheet-list/filter-sheet-list';
import { FilterSheetSearchableDrawer } from '../@generic/component/filter-sheet/filter-sheet-searchable-drawer/filter-sheet-searchable-drawer';
import { useSearchableFilterState } from '../@generic/hook/use-searchable-filter-state/use-searchable-filter-state.hook';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { SearchableFilterEmptyResult } from '../transaction/components/searchable-filter-empty-result/searchable-filter-empty-result';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { TransactionTagFilterItem } from '../transaction/components/transaction-tag-filter/transaction-tag-filter-item';
import { useTransactionTagFilterModal } from '../transaction/context/transaction-tag-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

export default function TransactionTagFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    const [, resolveTransactionTagFilter, currentParams] = useTransactionTagFilterModal();

    const state = useSearchableFilterState(currentParams?.value ?? null);
    const { localValue, setLocalValue, localValueRef, search, setSearch, selectedCount, handleDeselectAll } = state;

    const { tags, total } = useSearchTagsQuery(search);

    const items = tags ?? [];
    const showControls = !(isEmptyArray(items) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);

    const handleSelect = (selected: number) => void setLocalValue(prev => toggleFilterSelection(prev, [selected]));
    const handleSelectAll = () => void setLocalValue(() => items.map(item => item.id));
    const handleApply = () => void resolveTransactionTagFilter({ value: localValueRef.current });

    const handleNavigateToCreate = () => {
        resolveTransactionTagFilter(null, { skipBack: true });
        router.dismiss();
        router.push('/settings/tags');
    };

    const applyLabel = t({
        message: plural(selectedCount, {
            0: 'Show all tags',
            one: 'Show # tag',
            other: 'Show # tags'
        })
    });

    return (
        <FilterSheet>
            <FilterSheetList alignToBottom={isNotEmptyString(search)}>
                {isNotEmptyArray(items) ? (
                    <View className="gap-y-sm">
                        {items.map(tag => (
                            <TransactionTagFilterItem
                                tag={tag}
                                key={tag.id}
                                onSelect={handleSelect}
                                isSelected={localValue?.includes(tag.id) ?? false}
                            />
                        ))}
                    </View>
                ) : null}

                {isEmptyArray(items) && showEmptySearch ? (
                    <SearchableFilterEmptyResult>
                        <Trans>No tags found</Trans>
                    </SearchableFilterEmptyResult>
                ) : null}

                {isEmptyArray(items) && !showEmptySearch ? (
                    <TransactionFilterEmptyState
                        icon={UserIconNameEnum.Hash}
                        title={t`No Tags Yet`}
                        buttonText={t`Create Tags`}
                        onCreate={handleNavigateToCreate}
                        description={t`Create custom tags in Settings to label and filter your transactions`}
                    />
                ) : null}
            </FilterSheetList>

            <FilterSheetSearchableDrawer
                showControls={showControls}
                searchValue={search}
                searchPlaceholder={t`Search tags...`}
                onSearchChange={setSearch}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onApply={handleApply}
                applyLabel={applyLabel}
                selectedCount={selectedCount}
                searchTestID={TransactionFiltersSelector.TagSearchInput}
                selectAllTestID={TransactionFiltersSelector.TagSelectAllButton}
                deselectAllTestID={TransactionFiltersSelector.TagDeselectAllButton}
                applyTestID={TransactionFiltersSelector.TagApplyButton}
            />
        </FilterSheet>
    );
}
/* jscpd:ignore-end */
