import { AccountTypeEnum, AccountWithSyncEntityInterface } from '@budgie/contracts';

import { AccountCardBase } from '../account-card-base/account-card-base';
import { CryptoAccountCard } from '../crypto-account-card/crypto-account-card';
import { SyncAccountCard } from '../sync-account-card/sync-account-card';

interface Props {
    readonly account: AccountWithSyncEntityInterface;
    readonly balance: number;
    readonly type: AccountTypeEnum;
}

export const AccountCard = ({ account, balance, type }: Props) => {
    if (type === AccountTypeEnum.BANK_SYNC) {
        return <SyncAccountCard account={account} balance={balance} />;
    }

    if (type === AccountTypeEnum.CRYPTO || type === AccountTypeEnum.CRYPTO_SYNC) {
        return <CryptoAccountCard account={account} balance={balance} />;
    }

    return <AccountCardBase account={account} balance={balance} />;
};
