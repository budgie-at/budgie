import { AccountEntityInterface, AccountTypeEnum, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useMemo, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/component/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useAllAccountBalancesQuery } from '../../query/use-all-account-balances.query';
import { useSearchAccountsQuery } from '../../query/use-search-accounts.query';
import { AccountSelectorCard } from '../account-selector-card/account-selector-card';

interface Props {
    readonly emptyStateDescription?: string;
    readonly excludeAccountId: number | null;
    readonly excludeAccountTypes?: AccountTypeEnum[];
    readonly onSelect: (accountId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedAccount: AccountEntityInterface | null;
}

const keyExtractor = (item: AccountWithInstrumentEntityInterface) => item.id.toString();

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

const sortAccountsByActiveAndBalance = (
    accounts: AccountWithInstrumentEntityInterface[],
    balancesMap: Map<number, number>
): AccountWithInstrumentEntityInterface[] =>
    [...accounts].sort((first, second) => {
        if (first.isActive !== second.isActive) {
            return first.isActive ? -1 : 1;
        }

        const firstBalance = balancesMap.get(first.id) ?? 0;
        const secondBalance = balancesMap.get(second.id) ?? 0;

        return secondBalance - firstBalance;
    });

export const AccountSelectorBottomSheet = (props: Props) => {
    const { ref, selectedAccount, excludeAccountId, excludeAccountTypes, onSelect, emptyStateDescription } = props;
    const [search, setSearch] = useState('');
    const { accounts } = useSearchAccountsQuery(search, { excludeTypes: excludeAccountTypes });
    const { balancesMap } = useAllAccountBalancesQuery();
    const { t } = useLingui();

    const sortedAccounts = useMemo(() => {
        const filtered = accounts.filter(account => account.id !== excludeAccountId);

        return sortAccountsByActiveAndBalance(filtered, balancesMap);
    }, [accounts, excludeAccountId, balancesMap]);

    const handleSelect = (accountId: number) => {
        void ref.current?.dismiss();
        onSelect(accountId);
    };

    const renderItem = ({ item }: { item: AccountWithInstrumentEntityInterface }) => (
        <AccountSelectorCard
            isSelected={item.id === selectedAccount?.id}
            instrument={item.instrument}
            onSelect={handleSelect}
            title={item.title}
            icon={item.icon}
            type={item.type}
            key={item.id}
            id={item.id}
        />
    );

    const getEmptyStateDescription = () => {
        if (isNotEmptyString(search)) {
            return t`Try a different search term`;
        }

        return emptyStateDescription ?? t`Create one to get started.`;
    };

    const emptyIcon = isNotEmptyString(search) ? 'Search' : 'Wallet';
    const emptyTitle = isNotEmptyString(search) ? t`No accounts found` : t`No accounts yet`;

    return (
        <SearchableListBottomSheet
            ref={ref}
            emptyIcon={emptyIcon}
            title={t`Select Account`}
            description={t`Choose your main account`}
            onSearchChange={setSearch}
            searchPlaceholder={t`Search accounts...`}
            search={search}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            emptyDescription={getEmptyStateDescription()}
            emptyTitle={emptyTitle}
            data={sortedAccounts}
            flatListProps={flatListProps}
        />
    );
};
