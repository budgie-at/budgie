/* jscpd:ignore-start */
import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { Trans, useLingui } from '@lingui/react/macro';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { isEmptyArray, isEmptyString, isNotEmptyArray, isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { TransactionFiltersSelectors } from '../@e2e/selectors/transaction-filters.selector';
import { useFormsheetListStyles } from '../@generic/hook/use-formsheet-list-styles/use-formsheet-list-styles.hook';
import { useStateRef } from '../@generic/hook/use-state-ref/use-state-ref.hook';
import { AccountsGroup } from '../account/component/accounts-group/accounts-group';
import { useSearchAccountsGroupedQuery } from '../account/query/use-search-accounts-grouped.query';
import { SearchableFilterControls } from '../transaction/components/searchable-filter-controls/searchable-filter-controls';
import { SearchableFilterEmptyResult } from '../transaction/components/searchable-filter-empty-result/searchable-filter-empty-result';
import { SearchableFilterFooter } from '../transaction/components/searchable-filter-footer/searchable-filter-footer';
import { TransactionFilterEmptyState } from '../transaction/components/transaction-filter-empty-state/transaction-filter-empty-state';
import { TransactionFilterHeader } from '../transaction/components/transaction-filter-header/transaction-filter-header';
import { useTransactionAccountFilterModal } from '../transaction/context/transaction-account-filter-modal.context';
import { toggleFilterSelection } from '../transaction/utils/toggle-filter-selection.util';
// eslint-disable-next-line max-statements, max-lines-per-function -- Form orchestration component with multiple hooks and handlers
export default function TransactionAccountFilterModal() {
    const { t } = useLingui();
    const router = useRouter();
    const [, resolveTransactionAccountFilter, currentParams] = useTransactionAccountFilterModal();
    const { backgroundColor } = useFormsheetListStyles();

    const [localValue, setLocalValue, localValueRef] = useStateRef<number[] | null>(() => currentParams?.value ?? null);
    const [search, setSearch] = useState('');

    const { accountsGrouped, accounts, total } = useSearchAccountsGroupedQuery(search);

    const localSelectedCount = localValue?.length ?? 0;
    const containerStyle = { flex: 1, backgroundColor };
    const showControls = !(isEmptyArray(accounts) && isEmptyString(search));
    const showEmptySearch = isNotEmptyString(search) && isPositiveNumber(total);
    const selectedIds = localValue ?? [];
    /* jscpd:ignore-end */

    const handleSelect = (...accountIds: number[]) => {
        setLocalValue(prev => toggleFilterSelection(prev, accountIds));
    };

    const handleSelectAll = () => void setLocalValue(accounts.map(account => account.id));
    const handleDeselectAll = () => void setLocalValue(null);
    const handleClear = () => void setLocalValue(null);

    const handleApply = () => {
        resolveTransactionAccountFilter({ value: localValueRef.current });
    };

    const handleNavigateToCreate = () => {
        resolveTransactionAccountFilter(null, { skipBack: true });
        router.dismiss();
        router.push('/create-account');
    };

    /* jscpd:ignore-start */
    return (
        <View style={containerStyle}>
            <TransactionFilterHeader
                title={t`Accounts`}
                icon={UserIconNameEnum.Wallet}
                onClear={handleClear}
                showClear={isPositiveNumber(localSelectedCount)}
            />

            <ScrollView contentContainerClassName="py-[40px] px-7xl gap-y-3xl">
                <SearchableFilterControls
                    search={search}
                    onSearchChange={setSearch}
                    placeholder={t`Search accounts...`}
                    onSelectAll={handleSelectAll}
                    onDeselectAll={handleDeselectAll}
                    isVisible={showControls}
                    searchInputTestID={TransactionFiltersSelectors.AccountSearchInput}
                    selectAllButtonTestID={TransactionFiltersSelectors.AccountSelectAllButton}
                    deselectAllButtonTestID={TransactionFiltersSelectors.AccountDeselectAllButton}
                />
                {/* jscpd:ignore-end */}

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
            </ScrollView>

            <SearchableFilterFooter
                selectedCount={localSelectedCount}
                onApply={handleApply}
                applyButtonTestID={TransactionFiltersSelectors.AccountApplyButton}
            />
        </View>
    );
}
