import { useLingui } from '@lingui/react/macro';

import { AccountCardBase } from '../../../account/component/account-card-base/account-card-base';

import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly convertedBalance: number | null;
}

export const InzhurCashAccountCard = ({ account, balance, convertedBalance }: Props) => {
    const { t } = useLingui();

    return <AccountCardBase account={account} balance={balance} convertedBalance={convertedBalance} subtitle={t`Not yet invested`} />;
};
