import { AccountTypeEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { isNotEmptyArray, isPositiveNumber } from '@rnw-community/shared';

import { FilterChip } from '../../../@generic/components/filter-chip/filter-chip';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { AccountsGroup } from '../../../account/component/accounts-group/accounts-group';
import { useSearchAccountsGroupedQuery } from '../../../account/query/use-search-accounts-grouped.query';
import { TransactionMultiSelectFilter } from '../transaction-tag-filter/transaction-base-filter';
import { TransactionFilterEmptyState } from '../transaction-tag-filter/transaction-filter-empty-state';

interface Props {
    readonly value: number[] | null;
    readonly onChange: (value: number[] | null) => void;
}

export const TransactionAccountFilter = ({ value, onChange }: Props) => {
    const ref = useRef<BottomSheetInterface | null>(null);
    const [search, setSearch] = useState('');
    const { t } = useLingui();

    const { accountsGrouped, accounts } = useSearchAccountsGroupedQuery(search);

    const handleOpen = () => ref.current?.open();

    const selectedAccountsCount = value?.length ?? 0;
    const label = isPositiveNumber(selectedAccountsCount) ? t`Accounts (${selectedAccountsCount})` : t`Accounts`;

    const handleNavigateToAccounts = () => {
        ref.current?.close();
        void router.push('/create-account');
    };

    const renderItems = ({ selectedIds, onSelect }: { selectedIds: number[]; onSelect: (...accountIds: number[]) => void }) => (
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
            <FilterChip isActive={isPositiveNumber(selectedAccountsCount)} icon="Wallet" label={label} onPress={handleOpen} />

            <TransactionMultiSelectFilter
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
                        onCreate={handleNavigateToAccounts}
                        description={t`Create your first account to start tracking your finances`}
                    />
                }
                renderItems={renderItems}
            />
        </>
    );
};
