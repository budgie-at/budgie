/* jscpd:ignore-start */
import { UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useStateRef } from '../@generic/hook/use-state-ref/use-state-ref.hook';
import { useSearchTagsQuery } from '../tag/query/use-search-tags.query';
import { SearchableFilterControls } from '../transaction/components/searchable-filter-controls/searchable-filter-controls';
import { SearchableFilterEmptyResult } from '../transaction/components/searchable-filter-empty-result/searchable-filter-empty-result';
import { SearchableFilterFooter } from '../transaction/components/searchable-filter-footer/searchable-filter-footer';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { TransactionFilterHeader } from '../transaction/components/transaction-filter-header/transaction-filter-header';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { TransactionTagFilterItem } from '../transaction/components/transaction-tag-filter/transaction-tag-filter-item';
import { useTransactionTagFilterModal } from '../transaction/context/transaction-tag-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';
// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export default function TransactionTagFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    const [, resolveTransactionTagFilter, currentParams] = useTransactionTagFilterModal();
    const { backgroundColor } = useFormsheetListStyles();

    const [localValue, setLocalValue, localValueRef] = useStateRef<number[] | null>(() => currentParams?.value ?? null);
    const [search, setSearch] = useState('');

    const { tags, total } = useSearchTagsQuery(search);

    const localSelectedCount = localValue?.length ?? 0;
    const containerStyle = { flex: 1, backgroundColor };
    const items = tags ?? [];
    const showControls = !(isEmptyArray(items) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);
    /* jscpd:ignore-end */

    /* jscpd:ignore-start */
    const handleSelect = (selected: number) => {
        setLocalValue(prev => toggleFilterSelection(prev, [selected]));
    };

    const handleSelectAll = () => void setLocalValue(items.map(item => item.id));
    const handleDeselectAll = () => void setLocalValue(null);
    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveTransactionTagFilter({ value: localValueRef.current });
    };
    /* jscpd:ignore-end */

    const handleNavigateToCreate = () => {
        resolveTransactionTagFilter(null, { skipBack: true });
        router.dismiss();
        router.push('/settings/tags');
    };

    /* jscpd:ignore-start */
    return (
        <View style={containerStyle}>
            <TransactionFilterHeader
                title={t`Tags`}
                icon={UserIconNameEnum.Hash}
                onClear={handleClear}
                showClear={isPositiveNumber(localSelectedCount)}
            />

            <ScrollView contentContainerClassName="py-[40px] px-7xl gap-y-3xl">
                <SearchableFilterControls
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search tags...`}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    isVisible={showControls}
                    searchInputTestID={TransactionFiltersSelector.TagSearchInput}
                    selectAllButtonTestID={TransactionFiltersSelector.TagSelectAllButton}
                    deselectAllButtonTestID={TransactionFiltersSelector.TagDeselectAllButton}
                />
                {/* jscpd:ignore-end */}

                {isNotEmptyArray(items) ? (
                    <View>
                        {items.map((tag, index) => (
                            <TransactionTagFilterItem
                                tag={tag}
                                key={tag.id}
                                onSelect={handleSelect}
                                isFirst={index === 0}
                                isLast={index === items.length - 1}
                                isSelected={localValue?.includes(tag.id) ?? false}
                            />
                        ))}
                    </View>
                ) : null}

                {/* jscpd:ignore-start */}
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
            </ScrollView>

            <SearchableFilterFooter
                selectedCount={localSelectedCount}
                onApply={handleApply}
                applyButtonTestID={TransactionFiltersSelector.TagApplyButton}
            />
        </View>
    );
    /* jscpd:ignore-end */
}
