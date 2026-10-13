import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useDeferredValue, useState } from 'react';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { ArchivedAccountCard } from '../../../account/component/archived-account-card/archived-account-card';
import { ArchivedAccountsEmptyState } from '../../../account/component/archived-accounts-empty-state/archived-accounts-empty-state';
import { useDeleteAccount } from '../../../account/hooks/use-delete-account.hook';
import { useArchivedAccountsQuery } from '../../../account/query/use-archived-accounts.query';
import { filterAccountsBySearchQuery } from '../../../account/utils/filter-accounts-by-search-query.util';

import { ArchivedAccountsPageSelector } from './archived-accounts-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Archived() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const filteredAccounts = filterAccountsBySearchQuery(useArchivedAccountsQuery(), deferredSearch);

    const deleteAccount = useDeleteAccount();

    const renderCard = (account: AccountWithInstrumentEntityInterface) => <ArchivedAccountCard account={account} />;
    const getDeleteConfirmation = (account: AccountWithInstrumentEntityInterface) => {
        const accountTitle = account.title;

        return {
            title: t`Delete Account Permanently?`,
            description: t`${accountTitle} and its transactions will be permanently deleted. Transfers with other accounts stay there as “Transfer (account deleted)” and are left out of statistics. This cannot be undone.`,
            buttonText: t`Delete Permanently`
        };
    };

    return (
        <SearchablePage
            testID={ArchivedAccountsPageSelector.Container}
            onGoBack={handleGoBack}
            onDelete={deleteAccount}
            getDeleteConfirmation={getDeleteConfirmation}
            title={t`Archived Accounts`}
            searchPlaceholder={t`Search archived accounts...`}
            data={filteredAccounts}
            emptyState={<ArchivedAccountsEmptyState search={search} />}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            searchInputTestID={ArchivedAccountsPageSelector.SearchInput}
        />
    );
}
