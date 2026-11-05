import { useLingui } from '@lingui/react/macro';

import { AccountCardBalance } from '../../../account/component/account-card-balance/account-card-balance';
import { AccountCardBase } from '../../../account/component/account-card-base/account-card-base';

import type { AccountWithSyncEntityInterface } from '@budgie/contracts';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
}

export const InzhurCashAccountCard = ({ account, balance }: Props) => {
    const { t } = useLingui();

    return (
        <AccountCardBase account={account} balance={balance} convertedBalance={null} subtitle={t`Not yet invested`}>
            <AccountCardBalance title={account.title} balance={balance} instrumentSymbol={account.instrument.symbol} />
        </AccountCardBase>
    );
};
