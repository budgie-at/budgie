import { AccountEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { AccountsListPage } from '../../../account/component/accounts-list-page/accounts-list-page';
import { ArchivedAccountCard } from '../../../account/component/archived-account-card/archived-account-card';
import { ArchivedAccountsEmptyState } from '../../../account/component/archived-accounts-empty-state/archived-accounts-empty-state';
import { useGetArchivedAccountsQuery } from '../../../account/query/use-get-archived-accounts.query';

export default function Archived() {
    const { accounts } = useGetArchivedAccountsQuery();
    const { t } = useLingui();

    const archivedAccountsCount = accounts?.length ?? 0;

    const renderCard = (account: AccountEntityInterface) => <ArchivedAccountCard account={account} />;

    return (
        <AccountsListPage
            accounts={accounts}
            title={t`Archived Accounts`}
            description={t`${archivedAccountsCount} account`}
            icon="Archive"
            emptyState={<ArchivedAccountsEmptyState />}
            renderCard={renderCard}
        />
    );
}
