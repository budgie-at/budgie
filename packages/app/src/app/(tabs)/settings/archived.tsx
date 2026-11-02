import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { ArchivedAccountCard } from '../../../account/component/archived-account-card/archived-account-card';
import { ShelvedAccountsPage } from '../../../account/component/shelved-accounts-page/shelved-accounts-page';
import { archivedAccountsAtom } from '../../../account/query/use-archived-accounts.query';

import { ArchivedAccountsPageSelector } from './archived-accounts-page.selector';

export default function Archived() {
    const { t } = useLingui();

    const getNoMatchesTitle = (search: string) => t`No archived accounts match “${search}”`;
    const renderCard = (account: AccountWithInstrumentEntityInterface, isFirst: boolean, isLast: boolean) => (
        <ArchivedAccountCard account={account} isFirst={isFirst} isLast={isLast} />
    );

    return (
        <ShelvedAccountsPage
            accountsAtom={archivedAccountsAtom}
            title={t`Archived accounts`}
            description={t`Archived accounts are left out of Home, totals and budgets. Restore one to put it back with its history.`}
            searchPlaceholder={t`Search archived accounts…`}
            emptyState={
                <SearchablePageEmptyState
                    icon={UserIconNameEnum.Archive}
                    title={t`No archived accounts`}
                    description={t`Archive accounts you no longer use from their edit screen. Their history is kept so you can restore them.`}
                />
            }
            getNoMatchesTitle={getNoMatchesTitle}
            renderCard={renderCard}
            selector={ArchivedAccountsPageSelector}
        />
    );
}
