/* jscpd:ignore-start */
import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet';
import { FilterSheetHeader } from '../@generic/component/filter-sheet/filter-sheet-header';
import { FilterSheetList } from '../@generic/component/filter-sheet/filter-sheet-list';
import { FilterSheetSearchableDrawer } from '../@generic/component/filter-sheet/filter-sheet-searchable-drawer';
import { useSearchableFilterState } from '../@generic/hook/use-searchable-filter-state/use-searchable-filter-state.hook';
import { AccountsGroup } from '../account/component/accounts-group/accounts-group';
import { useSearchAccountsGroupedQuery } from '../account/query/use-search-accounts-grouped.query';
import { SearchableFilterEmptyResult } from '../transaction/components/searchable-filter-empty-result/searchable-filter-empty-result';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { useTransactionAccountFilterModal } from '../transaction/context/transaction-account-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

 
export default function TransactionAccountFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    const [, resolveTransactionAccountFilter, currentParams] = useTransactionAccountFilterModal();

    const state = useSearchableFilterState(currentParams?.value ?? null);
    const { localValue, setLocalValue, localValueRef, search, setSearch, selectedCount, handleDeselectAll, handleClear } = state;

    const { accountsGrouped, accounts, total } = useSearchAccountsGroupedQuery(search);

    const showControls = !(isEmptyArray(accounts) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);
    const selectedIds = localValue ?? [];

    const handleSelect = (...accountIds: number[]) => void setLocalValue(prev => toggleFilterSelection(prev, accountIds));
    const handleSelectAll = () => void setLocalValue(() => accounts.map(account => account.id));
    const handleApply = () => void resolveTransactionAccountFilter({ value: localValueRef.current });

    const handleNavigateToCreate = () => {
        resolveTransactionAccountFilter(null, { skipBack: true });
        router.dismiss();
        router.push('/create-account');
    };

    return (
        <FilterSheet>
            <FilterSheetHeader title={t`Accounts`} onClear={handleClear} showClear={isPositiveNumber(selectedCount)} />

            <FilterSheetList>
                {isNotEmptyArray(accounts) ? (
                    <View className="gap-y-lg">
                        {isNotEmptyArray(accountsGrouped.BANK) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.BANK}
                                accounts={accountsGrouped.BANK}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}

                        {isNotEmptyArray(accountsGrouped.CASH) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.CASH}
                                accounts={accountsGrouped.CASH}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}
                    </View>
                ) : null}

                {isEmptyArray(accounts) && showEmptySearch ? (
                    <SearchableFilterEmptyResult>
                        <Trans>No accounts found</Trans>
                    </SearchableFilterEmptyResult>
                ) : null}

                {isEmptyArray(accounts) && !showEmptySearch ? (
                    <TransactionFilterEmptyState
                        icon={UserIconNameEnum.Wallet}
                        title={t`No Accounts Yet`}
                        buttonText={t`Create Accounts`}
                        onCreate={handleNavigateToCreate}
                        description={t`Create your first account to start tracking your finances`}
                    />
                ) : null}
            </FilterSheetList>

            <FilterSheetSearchableDrawer
                showControls={showControls}
                searchValue={search}
                searchPlaceholder={t`Search accounts...`}
                onSearchChange={setSearch}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onApply={handleApply}
                selectedCount={selectedCount}
                searchTestID={TransactionFiltersSelectors.AccountSearchInput}
                selectAllTestID={TransactionFiltersSelectors.AccountSelectAllButton}
                deselectAllTestID={TransactionFiltersSelectors.AccountDeselectAllButton}
                applyTestID={TransactionFiltersSelectors.AccountApplyButton}
            />
        </FilterSheet>
    );
}
/* jscpd:ignore-end */
