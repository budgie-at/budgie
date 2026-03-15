import { AccountWithInstrumentEntityInterface } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';

import { InactiveAccountsPageSelectors } from '../../../@e2e/selectors/inactive-accounts-page.selector';
import { AccountsListPage } from '../../../account/component/accounts-list-page/accounts-list-page';
import { InactiveAccountCard } from '../../../account/component/inactive-account-card/inactive-account-card';
import { InactiveAccountsEmptyState } from '../../../account/component/inactive-accounts-empty-state/inactive-accounts-empty-state';
import { useGetInactiveAccountsQuery } from '../../../account/query/use-get-inactive-accounts.query';

export default function Inactive() {
    const { t } = useLingui();

    const { accounts } = useGetInactiveAccountsQuery();

    const renderCard = (account: AccountWithInstrumentEntityInterface) => <InactiveAccountCard account={account} />;

    return (
        <AccountsListPage
            accounts={accounts}
            title={t`Inactive Accounts`}
            renderCard={renderCard}
            testID={InactiveAccountsPageSelectors.Container}
        >
            <InactiveAccountsEmptyState />
        </AccountsListPage>
    );
}
