import { AccountEntityInterface, UserIconNameEnum } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { AccountsListPage } from '../../../account/component/accounts-list-page/accounts-list-page';
import { ArchivedAccountCard } from '../../../account/component/archived-account-card/archived-account-card';
import { ArchivedAccountsEmptyState } from '../../../account/component/archived-accounts-empty-state/archived-accounts-empty-state';
import { useGetArchivedAccountsQuery } from '../../../account/query/use-get-archived-accounts.query';

export default function Archived() {
    const { t } = useLingui();

    const { accounts } = useGetArchivedAccountsQuery();

    const archivedAccountsCount = accounts?.length ?? 0;

    const renderCard = (account: AccountEntityInterface) => <ArchivedAccountCard account={account} />;

    return (
        <AccountsListPage
            accounts={accounts}
            title={t`Archived Accounts`}
            description={t`${archivedAccountsCount} account`}
            icon={UserIconNameEnum.Archive}
            renderCard={renderCard}
        >
            <ArchivedAccountsEmptyState />
        </AccountsListPage>
    );
}
