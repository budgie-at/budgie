import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

import { AccountCardBase } from '../account-card-base/account-card-base';
import { CryptoAccountCard } from '../crypto-account-card/crypto-account-card';
import { SyncAccountCard } from '../sync-account-card/sync-account-card';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly convertedBalance: number | null;
    readonly type: AccountTypeEnum;
}

export const AccountCard = ({ account, balance, convertedBalance, type }: Props) => {
    if (type === AccountTypeEnum.BANK_SYNC) {
        return <SyncAccountCard account={account} balance={balance} convertedBalance={convertedBalance} />;
    }

    if (type === AccountTypeEnum.CRYPTO || type === AccountTypeEnum.CRYPTO_SYNC) {
        return <CryptoAccountCard account={account} balance={balance} convertedBalance={convertedBalance} />;
    }

    return <AccountCardBase account={account} balance={balance} convertedBalance={convertedBalance} />;
};
