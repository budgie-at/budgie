import { AccountEntityInterface, AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { RefObject, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchableListBottomSheet } from '../../../@generic/components/bottom-sheet-searchable-list/bottom-sheet-searchable-list';
import { BottomSheetInterface } from '../../../@generic/interface/bottom-sheet.interface';
import { useSearchAccountsQuery } from '../../query/use-search-accounts.query';
import { AccountSelectorCard } from '../account-selector-card/account-selector-card';

interface Props {
    readonly emptyStateDescription?: string;
    readonly excludeAccountId: number | null;
    readonly onSelect: (accountId: number) => void;
    readonly ref: RefObject<BottomSheetInterface | null>;
    readonly selectedAccount: AccountEntityInterface | null;
}

const keyExtractor = (item: AccountWithInstrumentEntityInterface) => item.id.toString();

const flatListProps = {
    className: 'pt-3 px-xl',
    contentContainerClassName: 'gap-y-lg'
};

export const AccountSelectorBottomSheet = ({ ref, selectedAccount, excludeAccountId, onSelect, emptyStateDescription }: Props) => {
    const [search, setSearch] = useState('');
    const { accounts } = useSearchAccountsQuery(search);
    const { t } = useLingui();

    const handleSelect = (accountId: number) => {
        onSelect(accountId);
        ref.current?.close();
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

    const emptyDescription = getEmptyStateDescription();

    const accountsWithoutExcluded = accounts.filter(account => account.id !== excludeAccountId);

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
            emptyDescription={emptyDescription}
            emptyTitle={emptyTitle}
            data={accountsWithoutExcluded}
            flatListProps={flatListProps}
        />
    );
};
