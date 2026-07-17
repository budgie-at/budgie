import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { View } from 'react-native';

import { isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { FilterSheetList } from '../@generic/component/filter-sheet/filter-sheet-list/filter-sheet-list';
import { FilterSheetSkeleton } from '../@generic/component/filter-sheet/filter-sheet-skeleton/filter-sheet-skeleton';
import { FilterSheet } from '../@generic/component/filter-sheet/filter-sheet/filter-sheet';
import { useSearchableFilterState } from '../@generic/hook/use-searchable-filter-state/use-searchable-filter-state.hook';
import { AccountsGroup } from '../account/component/accounts-group/accounts-group';
import { useSearchAccountsGroupedQuery } from '../account/query/use-search-accounts-grouped.query';
import { SearchableFilterEmptyResult } from '../transaction/components/searchable-filter-empty-result/searchable-filter-empty-result';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { TransactionFilterSelectorFooter } from '../transaction/components/transaction-filter-selector-footer/transaction-filter-selector-footer';
import { TransactionFilterSelectorHeader } from '../transaction/components/transaction-filter-selector-header/transaction-filter-selector-header';
import { TransactionFiltersSelector } from '../transaction/components/transaction-filters/transaction-filters.selector';
import { useTransactionAccountFilterModal } from '../transaction/context/transaction-account-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';

const LIST_TOP_SPACE = 88;

const ANALYTICS_ACCOUNT_FILTER_TYPES = [
    AccountTypeEnum.BANK,
    AccountTypeEnum.BANK_SYNC,
    AccountTypeEnum.CASH,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.STOCKS,
    AccountTypeEnum.SAVINGS
] satisfies Exclude<AccountTypeEnum, AccountTypeEnum.DEBT>[];

// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks, handlers, and per-account-type group blocks
export default function TransactionAccountFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    const [, resolveTransactionAccountFilter, currentParams] = useTransactionAccountFilterModal();

    const state = useSearchableFilterState(currentParams?.value ?? null);
    const { localValue, setLocalValue, localValueRef, search, setSearch, selectedCount, handleDeselectAll } = state;

    const { accountsGrouped, total, isLoading } = useSearchAccountsGroupedQuery(search);

    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total) && !isLoading;
    const selectedIds = localValue ?? [];
    const accountGroups = ANALYTICS_ACCOUNT_FILTER_TYPES.map(type => ({ type, accounts: accountsGrouped[type] ?? [] })).filter(group =>
        isNotEmptyArray(group.accounts)
    );

    const handleSelect = (...accountIds: number[]) => void setLocalValue(prev => toggleFilterSelection(prev, accountIds));
    const handleSelectAll = () => void setLocalValue(() => accountGroups.flatMap(group => group.accounts).map(account => account.id));
    const handleApply = () => void resolveTransactionAccountFilter({ value: localValueRef.current });
    const handleClose = () => void resolveTransactionAccountFilter(null);

    const handleNavigateToCreate = () => {
        resolveTransactionAccountFilter(null, { skipBack: true });
        router.dismiss();
        router.push('/create-account');
    };

    const applyLabel = t({
        message: plural(selectedCount, {
            0: 'Show all accounts',
            one: 'Show # account',
            other: 'Show # accounts'
        })
    });

    return (
        <FilterSheet>
            <TransactionFilterSelectorHeader title={t`Filter accounts`} onClose={handleClose} />

            <FilterSheetList alignToBottom topSpacing={LIST_TOP_SPACE}>
                {isLoading ? <FilterSheetSkeleton alignToBottom /> : null}

                {isNotEmptyArray(accountGroups) && !isLoading ? (
                    <View className="gap-y-lg">
                        {isNotEmptyArray(accountsGrouped.BANK) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.BANK}
                                accounts={accountsGrouped.BANK}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}

                        {isNotEmptyArray(accountsGrouped.BANK_SYNC) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.BANK_SYNC}
                                accounts={accountsGrouped.BANK_SYNC}
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

                        {isNotEmptyArray(accountsGrouped.CRYPTO) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.CRYPTO}
                                accounts={accountsGrouped.CRYPTO}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}

                        {isNotEmptyArray(accountsGrouped.STOCKS) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.STOCKS}
                                accounts={accountsGrouped.STOCKS}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}

                        {isNotEmptyArray(accountsGrouped.SAVINGS) ? (
                            <AccountsGroup
                                onSelect={handleSelect}
                                type={AccountTypeEnum.SAVINGS}
                                accounts={accountsGrouped.SAVINGS}
                                selectedAccountIds={selectedIds}
                            />
                        ) : null}
                    </View>
                ) : null}

                {isEmptyArray(accountGroups) && showEmptySearch ? (
                    <SearchableFilterEmptyResult>
                        <Trans>No accounts found</Trans>
                    </SearchableFilterEmptyResult>
                ) : null}

                {isEmptyArray(accountGroups) && !showEmptySearch && !isLoading ? (
                    <TransactionFilterEmptyState
                        icon={UserIconNameEnum.Wallet}
                        title={t`No Accounts Yet`}
                        buttonText={t`Create Accounts`}
                        onCreate={handleNavigateToCreate}
                        description={t`Create your first account to start tracking your finances`}
                    />
                ) : null}
            </FilterSheetList>

            <TransactionFilterSelectorFooter
                searchValue={search}
                searchPlaceholder={t`Search accounts...`}
                onSearchChange={setSearch}
                onSelectAll={handleSelectAll}
                onDeselectAll={handleDeselectAll}
                onApply={handleApply}
                applyLabel={applyLabel}
                selectedCount={selectedCount}
                isLoading={isLoading}
                searchTestID={TransactionFiltersSelector.AccountSearchInput}
                selectAllTestID={TransactionFiltersSelector.AccountSelectAllButton}
                deselectAllTestID={TransactionFiltersSelector.AccountDeselectAllButton}
                applyTestID={TransactionFiltersSelector.AccountApplyButton}
            />
        </FilterSheet>
    );
}
