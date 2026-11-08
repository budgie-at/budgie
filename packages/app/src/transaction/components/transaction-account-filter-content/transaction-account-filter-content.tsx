import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { plural } from '@lingui/core/macro';
import { Trans, useLingui } from '@lingui/react/macro';
import { ScrollView, View } from 'react-native';

import { EmptyFn, isEmptyArray, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { FeatureIntro } from '../../../@generic/component/feature-intro/feature-intro';
import { FilterSheetApply } from '../../../@generic/component/filter-sheet/filter-sheet-apply/filter-sheet-apply';
import { FilterSheetBulkToggle } from '../../../@generic/component/filter-sheet/filter-sheet-bulk-toggle/filter-sheet-bulk-toggle';
import { FilterSheetSkeleton } from '../../../@generic/component/filter-sheet/filter-sheet-skeleton/filter-sheet-skeleton';
import { AccountsGroup } from '../../../account/component/accounts-group/accounts-group';
import { useSearchAccountsGroupedQuery } from '../../../account/query/use-search-accounts-grouped.query';
import { useFilterSheetSelection } from '../../hook/use-filter-sheet-selection.hook';
import { SearchableFilterEmptyResult } from '../searchable-filter-empty-result/searchable-filter-empty-result';
import { TransactionFilterSelectionSheet } from '../transaction-filter-selection-sheet/transaction-filter-selection-sheet';
import { TransactionFiltersSelector } from '../transaction-filters/transaction-filters.selector';

import type { TransactionAccountFilterResult } from '../../context/transaction-account-filter-modal.context';

const ANALYTICS_ACCOUNT_FILTER_TYPES = [
    AccountTypeEnum.BANK,
    AccountTypeEnum.BANK_SYNC,
    AccountTypeEnum.CASH,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.CRYPTO_SYNC,
    AccountTypeEnum.STOCKS,
    AccountTypeEnum.SAVINGS
] satisfies Exclude<AccountTypeEnum, AccountTypeEnum.DEBT>[];

interface Props {
    readonly value: number[] | null;
    readonly onCommit: (result: TransactionAccountFilterResult) => void;
    readonly onCreateAccount: EmptyFn;
}

export const TransactionAccountFilterContent = ({ value, onCommit, onCreateAccount }: Props) => {
    const { t } = useLingui();
    const { localValue, search, setSearch, selectedCount, handleDeselectAll, handleSelect, handleSelectAll, handleApply } =
        useFilterSheetSelection(value, onCommit);
    const { accountsGrouped, total, isLoading } = useSearchAccountsGroupedQuery(search);

    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total) && !isLoading;
    const selectedIds = localValue ?? [];
    const accountGroups = ANALYTICS_ACCOUNT_FILTER_TYPES.map(type => ({ type, accounts: accountsGrouped[type] ?? [] })).filter(group =>
        isNotEmptyArray(group.accounts)
    );
    const accountIds = accountGroups.flatMap(group => group.accounts).map(account => account.id);

    const handleSelectAllAccounts = () => void handleSelectAll(accountIds);

    const handleCreateAccount = () => {
        onCreateAccount();
        handleApply();
    };

    const applyLabel = t({
        message: plural(selectedCount, {
            0: 'Show all accounts',
            one: 'Show # account',
            other: 'Show # accounts'
        })
    });

    return (
        <TransactionFilterSelectionSheet
            title={t`Filter accounts`}
            searchPlaceholder={t`Search accounts...`}
            searchValue={search}
            onSearchChange={setSearch}
            searchTestID={TransactionFiltersSelector.AccountSearchInput}
            apply={<FilterSheetApply onApply={handleApply} label={applyLabel} testID={TransactionFiltersSelector.AccountApplyButton} />}
            bulkToggle={
                <FilterSheetBulkToggle
                    isLoading={isLoading}
                    selectedCount={selectedCount}
                    onSelectAll={handleSelectAllAccounts}
                    onDeselectAll={handleDeselectAll}
                    selectAllTestID={TransactionFiltersSelector.AccountSelectAllButton}
                    deselectAllTestID={TransactionFiltersSelector.AccountDeselectAllButton}
                />
            }
        >
            <ScrollView
                className="flex-1"
                contentContainerClassName="grow justify-end gap-y-md px-3xl pt-lg pb-[16px]"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
            >
                {isLoading ? <FilterSheetSkeleton alignToBottom /> : null}

                {isNotEmptyArray(accountGroups) && !isLoading ? (
                    <View className="gap-y-lg">
                        {accountGroups.map(group => (
                            <AccountsGroup
                                key={group.type}
                                onSelect={handleSelect}
                                type={group.type}
                                accounts={group.accounts}
                                selectedAccountIds={selectedIds}
                            />
                        ))}
                    </View>
                ) : null}

                {isEmptyArray(accountGroups) && showEmptySearch ? (
                    <SearchableFilterEmptyResult>
                        <Trans>No accounts found</Trans>
                    </SearchableFilterEmptyResult>
                ) : null}

                {isEmptyArray(accountGroups) && !showEmptySearch && !isLoading ? (
                    <FeatureIntro
                        icon={UserIconNameEnum.Wallet}
                        title={t`No Accounts Yet`}
                        buttonText={t`Create Accounts`}
                        onCreate={handleCreateAccount}
                        description={t`Create your first account to start tracking your finances`}
                    />
                ) : null}
            </ScrollView>
        </TransactionFilterSelectionSheet>
    );
};
