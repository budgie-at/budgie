import { AccountWithInstrumentEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { SearchablePageEmptyState } from '../../../@generic/component/searchable-page-empty-state/searchable-page-empty-state';
import { InactiveAccountCard } from '../../../account/component/inactive-account-card/inactive-account-card';
import { ShelvedAccountsPage } from '../../../account/component/shelved-accounts-page/shelved-accounts-page';
import { inactiveAccountsAtom } from '../../../account/query/use-inactive-accounts.query';

import { InactiveAccountsPageSelector } from './inactive-accounts-page.selector';

export default function Inactive() {
    const { t } = useLingui();

    const getNoMatchesTitle = (search: string) => t`No hidden accounts match “${search}”`;
    const renderCard = (account: AccountWithInstrumentEntityInterface, isFirst: boolean, isLast: boolean) => (
        <InactiveAccountCard account={account} isFirst={isFirst} isLast={isLast} />
    );

    return (
        <ShelvedAccountsPage
            accountsAtom={inactiveAccountsAtom}
            title={t`Hidden accounts`}
            description={t`Hidden accounts stay off Home. Their totals and net worth settings don’t change.`}
            searchPlaceholder={t`Search hidden accounts…`}
            emptyState={
                <SearchablePageEmptyState
                    icon={UserIconNameEnum.EyeOff}
                    title={t`No hidden accounts`}
                    description={t`Turn off Show on Home in an account’s edit screen to tuck it away here.`}
                />
            }
            getNoMatchesTitle={getNoMatchesTitle}
            renderCard={renderCard}
            selector={InactiveAccountsPageSelector}
        />
    );
}
