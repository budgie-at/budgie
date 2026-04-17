import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useDeferredValue, useState } from 'react';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { InactiveAccountCard } from '../../../account/component/inactive-account-card/inactive-account-card';
import { InactiveAccountsEmptyState } from '../../../account/component/inactive-accounts-empty-state/inactive-accounts-empty-state';
import { useGetInactiveAccountsQuery } from '../../../account/query/use-get-inactive-accounts.query';
import { filterAccountsBySearchQuery } from '../../../account/utils/filter-accounts-by-search-query.util';

import { InactiveAccountsPageSelector } from './inactive-accounts-page.selector';

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Inactive() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const { accounts } = useGetInactiveAccountsQuery();
    const filteredAccounts = filterAccountsBySearchQuery(accounts, deferredSearch);

    const renderCard = (account: AccountWithInstrumentEntityInterface) => <InactiveAccountCard account={account} />;

    return (
        <SearchablePage
            testID={InactiveAccountsPageSelector.Container}
            onGoBack={handleGoBack}
            title={t`Inactive Accounts`}
            searchPlaceholder={t`Search inactive accounts...`}
            data={filteredAccounts}
            emptyState={<InactiveAccountsEmptyState search={search} />}
            renderCard={renderCard}
            search={search}
            onSearchChange={setSearch}
            searchInputTestID={InactiveAccountsPageSelector.SearchInput}
        />
    );
}
