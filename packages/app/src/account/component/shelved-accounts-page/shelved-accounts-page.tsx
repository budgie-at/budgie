import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useDeferredValue, useState } from 'react';

import { isNotEmptyString, isPositiveNumber } from '@rnw-community/shared';

import { EntitySearchableList } from '../../../@generic/component/entity-searchable-list/entity-searchable-list';
import { SearchablePage } from '../../../@generic/component/searchable-page/searchable-page';
import { useLiveAtomValue } from '../../../@generic/hook/use-live-atom-value.hook';
import { goBackToSettings } from '../../../settings/utils/go-back-to-settings.util';
import { getShelvedAccountsList } from '../../utils/get-shelved-accounts-list.util';
import { AutomaticAccountCard } from '../automatic-account-card/automatic-account-card';
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
    const shelvedList = getShelvedAccountsList(isFailure ? [] : AsyncResult.getOrElse(result, () => null), deferredSearch);
    const trimmedSearch = search.trim();
    const countTitle = isPositiveNumber(shelvedList.shelvedCount)
        ? t({ message: plural(shelvedList.shelvedCount, { one: '# account', other: '# accounts' }) })
        : null;

    const handleClearSearch = () => void setSearch('');
    const renderItem = (account: AccountWithInstrumentEntityInterface, index: number, isLast: boolean) =>
        index < shelvedList.shelvedCount ? (
            renderCard(account, index === 0, index === shelvedList.shelvedCount - 1)
        ) : (
            <AutomaticAccountCard account={account} isFirst={index === shelvedList.shelvedCount} isLast={isLast} />
        );

    const noMatchesState = isNotEmptyString(trimmedSearch) ? (
        <ShelvedAccountsNoMatchesState title={getNoMatchesTitle(trimmedSearch)} onClearSearch={handleClearSearch} />
    ) : (
        emptyState
    );

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
            <EntitySearchableList
                data={shelvedList.accounts}
                isFailure={isFailure}
                onRetry={retry}
                emptyState={noMatchesState}
                listHeader={<ShelvedAccountsListHeader description={description} title={countTitle} />}
                renderCard={renderItem}
            />
        </SearchablePage>
    );
};
