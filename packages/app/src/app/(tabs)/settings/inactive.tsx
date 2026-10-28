import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { useDeferredValue, useState } from 'react';

import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { InactiveAccountCard } from '../../../account/component/inactive-account-card/inactive-account-card';
import { InactiveAccountsEmptyState } from '../../../account/component/inactive-accounts-empty-state/inactive-accounts-empty-state';
import { useInactiveAccountsQuery } from '../../../account/query/use-inactive-accounts.query';
import { filterAccountsBySearchQuery } from '../../../account/utils/filter-accounts-by-search-query.util';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';

import { InactiveAccountsPageSelector } from './inactive-accounts-page.selector';

export default function Inactive() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const filteredAccounts = filterAccountsBySearchQuery(useInactiveAccountsQuery(), deferredSearch);

    const renderCard = (account: AccountWithInstrumentEntityInterface) => <InactiveAccountCard account={account} />;

    return (
        <SearchablePage
            testID={InactiveAccountsPageSelector.Container}
            title={t`Inactive Accounts`}
            onGoBack={goBackToSettings}
            search={search}
            searchPlaceholder={t`Search inactive accounts...`}
            onSearchChange={setSearch}
            searchInputTestID={InactiveAccountsPageSelector.SearchInput}
        >
            <SearchablePageList
                data={filteredAccounts}
                emptyState={<InactiveAccountsEmptyState search={search} />}
                renderCard={renderCard}
            />
        </SearchablePage>
    );
}
