import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useDeferredValue, useState } from 'react';

import { isNotEmptyString } from '@rnw-community/shared';

import { SearchablePageErrorState } from '../../../@generic/component/searchable-page-error-state/searchable-page-error-state';
import { SearchablePageList } from '../../../@generic/component/searchable-page-list/searchable-page-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { filterAccountsBySearchQuery } from '../../utils/filter-accounts-by-search-query.util';
import { ShelvedAccountsListHeader } from '../shelved-accounts-list-header/shelved-accounts-list-header';
import { ShelvedAccountsNoMatchesState } from '../shelved-accounts-no-matches-state/shelved-accounts-no-matches-state';

import type { ShelvedAccountsPageSelectorInterface } from '../../interface/shelved-accounts-page-selector.interface';
import type * as Atom from 'effect/reactivity/Atom';
import type { ReactNode } from 'react';

interface Props {
    readonly accountsAtom: Atom.Atom<AsyncResult.AsyncResult<AccountWithInstrumentEntityInterface[], unknown>>;
    readonly title: string;
    readonly description: string;
    readonly searchPlaceholder: string;
    readonly emptyState: ReactNode;
    readonly getNoMatchesTitle: (search: string) => string;
    readonly renderCard: (account: AccountWithInstrumentEntityInterface, isFirst: boolean, isLast: boolean) => ReactNode;
    readonly selector: ShelvedAccountsPageSelectorInterface;
}

export const ShelvedAccountsPage = (props: Props) => {
    const { accountsAtom, title, description, searchPlaceholder, emptyState, getNoMatchesTitle, renderCard, selector } = props;
    const { t } = useLingui();
    const [search, setSearch] = useState('');
    const deferredSearch = useDeferredValue(search);
    const result = useLiveAtomValue(accountsAtom);
    const retry = useAtomRefresh(accountsAtom);

    const isFailure = AsyncResult.isFailure(result);
    const filteredAccounts = isFailure
        ? []
        : filterAccountsBySearchQuery(
              AsyncResult.getOrElse(result, () => null),
              deferredSearch
          );
    const trimmedSearch = search.trim();
    const countTitle = t({ message: plural(filteredAccounts?.length ?? 0, { one: '# account', other: '# accounts' }) });

    const handleClearSearch = () => void setSearch('');
    const renderItem = (account: AccountWithInstrumentEntityInterface, index: number, isLast: boolean) =>
        renderCard(account, index === 0, isLast);

    const noMatchesState = isNotEmptyString(trimmedSearch) ? (
        <ShelvedAccountsNoMatchesState title={getNoMatchesTitle(trimmedSearch)} onClearSearch={handleClearSearch} />
    ) : (
        emptyState
    );
    const visibleEmptyState = isFailure ? <SearchablePageErrorState onRetry={retry} /> : noMatchesState;

    return (
        <SearchablePage
            testID={selector.Container}
            title={title}
            onGoBack={goBackToSettings}
            search={search}
            searchPlaceholder={searchPlaceholder}
            onSearchChange={setSearch}
            searchInputTestID={selector.SearchInput}
        >
            <SearchablePageList
                data={filteredAccounts}
                emptyState={visibleEmptyState}
                listHeader={<ShelvedAccountsListHeader description={description} title={countTitle} />}
                renderCard={renderItem}
                gap={0}
            />
        </SearchablePage>
    );
};
