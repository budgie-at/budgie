import { AccountTypeEnum, AccountWithSyncEntityInterface, InstrumentTypeEnum } from '@budgie/contracts';

import { InzhurCashAccountCard } from '../../../inzhur/component/inzhur-cash-account-card/inzhur-cash-account-card';
import { isInzhurCashAccount } from '../../../inzhur/utils/is-inzhur-cash-account.util';
import { isCryptoAccountType } from '../../utils/is-crypto-account-type.util';
import { AccountCardBase } from '../account-card-base/account-card-base';
import { CryptoAccountCard } from '../crypto-account-card/crypto-account-card';
import { FundAccountCard } from '../fund-account-card/fund-account-card';
import { SyncAccountCard } from '../sync-account-card/sync-account-card';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly convertedBalance: number | null;
}

export const AccountCard = ({ account, balance, convertedBalance }: Props) => {
    if (account.instrument.type === InstrumentTypeEnum.FUND) {
        return <FundAccountCard account={account} balance={balance} convertedBalance={convertedBalance} />;
    }

    if (isInzhurCashAccount(account)) {
        return <InzhurCashAccountCard account={account} balance={balance} />;
    }

    if (account.type === AccountTypeEnum.BANK_SYNC) {
        return <SyncAccountCard account={account} balance={balance} convertedBalance={convertedBalance} />;
    }

    if (isCryptoAccountType(account.type)) {
        return <CryptoAccountCard account={account} balance={balance} convertedBalance={convertedBalance} />;
    }

    return <AccountCardBase account={account} balance={balance} convertedBalance={convertedBalance} />;
};
