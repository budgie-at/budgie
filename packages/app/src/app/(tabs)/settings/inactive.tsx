import { AccountEntityTable, AccountRepository, AccountWithInstrumentEntityInterface, InstrumentEntityTable } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useDeferredValue, useState } from 'react';

import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../../@generic/utils/database-query-atom.util';
import { goBackOrReplace } from '../../../@generic/utils/go-back-or-replace.util';
import { InactiveAccountCard } from '../../../account/component/inactive-account-card/inactive-account-card';
import { InactiveAccountsEmptyState } from '../../../account/component/inactive-accounts-empty-state/inactive-accounts-empty-state';
import { filterAccountsBySearchQuery } from '../../../account/utils/filter-accounts-by-search-query.util';

import { InactiveAccountsPageSelector } from './inactive-accounts-page.selector';

const inactiveAccountsAtom = databaseQueryAtom(
    [AccountEntityTable, InstrumentEntityTable],
    Effect.flatMap(AccountRepository, accountRepository => accountRepository.getAllInactive())
);

const handleGoBack = () => void goBackOrReplace('/settings');

export default function Inactive() {
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);

    const result = useLiveAtomValue(inactiveAccountsAtom);
    const filteredAccounts = filterAccountsBySearchQuery(
        AsyncResult.getOrElse(result, (): AccountWithInstrumentEntityInterface[] => []),
        deferredSearch
    );

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
