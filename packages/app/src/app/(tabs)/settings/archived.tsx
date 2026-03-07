import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { ArchivedAccountsPageSelectors } from '../../../@e2e/selectors/archived-accounts-page.selector';
import { AccountsListPage } from '../../../account/component/accounts-list-page/accounts-list-page';
import { ArchivedAccountCard } from '../../../account/component/archived-account-card/archived-account-card';
import { ArchivedAccountsEmptyState } from '../../../account/component/archived-accounts-empty-state/archived-accounts-empty-state';
import { useGetArchivedAccountsQuery } from '../../../account/query/use-get-archived-accounts.query';

export default function Archived() {
    const { t } = useLingui();

    const { accounts } = useGetArchivedAccountsQuery();

    const renderCard = (account: AccountWithInstrumentEntityInterface) => <ArchivedAccountCard account={account} />;

    return (
        <AccountsListPage
            accounts={accounts}
            title={t`Archived Accounts`}
            renderCard={renderCard}
            testID={ArchivedAccountsPageSelectors.Container}
        >
            <ArchivedAccountsEmptyState />
        </AccountsListPage>
    );
}
