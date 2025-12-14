import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { AccountsGroup } from '../../../account/component/accounts-group/accounts-group';
import { useSearchAccountsGroupedQuery } from '../../../account/query/use-search-accounts-grouped.query';
import { useTransactionFilter } from '../../hook/use-transaction-filter.hook';
import { TransactionFilterRenderItemsArgsInterface } from '../../interface/transaction-filter-render-items-args.interface';
import { TransactionBaseSearchableFilter } from '../transaction-base-filter/transaction-base-searchable-filter';
import { TransactionFilterChip } from '../transaction-filter-chip/transaction-filter-chip';
import { TransactionFilterEmptyState } from '../transaction-filter-empty-state/transaction-filter-empty-state';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionAccountFilter = ({ value, onChange }: Props) => {
    const { ref, search, setSearch, handleOpen, handleNavigateToCreate } = useTransactionFilter('/create-account', value);
    const { t } = useLingui();

    const { accountsGrouped, accounts, total } = useSearchAccountsGroupedQuery(search);

    const selectedAccountsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedAccountsCount) ? t`Accounts (${selectedAccountsCount})` : t`Accounts`;

    const renderItems = ({ selectedIds, onSelect }: TransactionFilterRenderItemsArgsInterface<AccountEntityInterface>) => (
        <View className="gap-y-lg">
            {isNotEmptyArray(accountsGrouped.BANK) ? (
                <AccountsGroup
                    onSelect={onSelect}
                    type={AccountTypeEnum.BANK}
                    accounts={accountsGrouped.BANK}
                    selectedAccountIds={selectedIds}
                />
            ) : null}

            {isNotEmptyArray(accountsGrouped.CASH) ? (
                <AccountsGroup
                    onSelect={onSelect}
                    type={AccountTypeEnum.CASH}
                    accounts={accountsGrouped.CASH}
                    selectedAccountIds={selectedIds}
                />
            ) : null}
        </View>
    );

    return (
        <>
            <TransactionFilterChip isActive={isPositiveNumber(selectedAccountsCount)} icon="Wallet" label={label} onPress={handleOpen} />

            <TransactionBaseSearchableFilter
                total={total}
                ref={ref}
                title={t`Accounts`}
                icon="Wallet"
                search={search}
                items={accounts}
                onSearchChange={setSearch}
                searchPlaceholder={t`Search accounts...`}
                value={value}
                onChange={onChange}
                emptySearchText={t`No accounts found`}
                emptyState={
                    <TransactionFilterEmptyState
                        icon="Wallet"
                        buttonText={t`Create accounts`}
                        title={t`No accounts yet`}
                        onCreate={handleNavigateToCreate}
                        description={t`Create your first account to start tracking your finances`}
                    />
                }
                renderItems={renderItems}
            />
        </>
    );
};
