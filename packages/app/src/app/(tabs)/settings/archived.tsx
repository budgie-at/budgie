import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useDeferredValue, useState } from 'react';
import Toast from 'react-native-toast-message';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { ArchivedAccountCard } from '../../../account/component/archived-account-card/archived-account-card';
import { ArchivedAccountsEmptyState } from '../../../account/component/archived-accounts-empty-state/archived-accounts-empty-state';
import { useGetArchivedAccountsQuery } from '../../../account/query/use-get-archived-accounts.query';
import { accountService } from '../../../account/service/account.service';
import { filterAccountsBySearchQuery } from '../../../account/utils/filter-accounts-by-search-query.util';

import { ArchivedAccountsPageSelector } from './archived-accounts-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Archived() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const { accounts } = useGetArchivedAccountsQuery();
    const filteredAccounts = filterAccountsBySearchQuery(accounts, deferredSearch);

    const renderCard = (account: AccountWithInstrumentEntityInterface) => <ArchivedAccountCard account={account} />;
    const getDeleteConfirmation = (account: AccountWithInstrumentEntityInterface) => {
        const accountTitle = account.title;

        return {
            title: t`Delete Account Permanently?`,
            description: t`${accountTitle} and its transactions will be permanently deleted. Transfers will be converted to income/expense on other accounts. This cannot be undone.`,
            buttonText: t`Delete Permanently`
        };
    };

    const handleDeleteAccount = async (id: number) => {
        try {
            await accountService.deleteById(id);
        } catch (error) {
            Toast.show({
                type: 'error',
                text1: t`Could not delete account.`,
                text2: t`Something went wrong. Please try again later.`
            });

            throw error;
        }
    };

    return (
        <SearchablePage
            testID={ArchivedAccountsPageSelector.Container}
            onGoBack={handleGoBack}
            onDelete={handleDeleteAccount}
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
