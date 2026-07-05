import { AccountTypeEnum, AccountWithSyncEntityInterface, SyncEntityInterface } from '@budgie/contracts';

import { AccountCardBase } from '../account-card-base/account-card-base';
import { CryptoAccountCard } from '../crypto-account-card/crypto-account-card';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';
import { SyncAccountCard } from '../sync-account-card/sync-account-card';

interface Props extends Pick<
    AccountWithSyncEntityInterface,
    'id' | 'createdAt' | 'title' | 'type' | 'icon' | 'externalId' | 'debtType' | 'targetBalance' | 'deadline'
> {
    readonly balance: number;
    readonly sync: SyncEntityInterface | null;
    readonly className?: string;
    readonly instrumentId: number;
    readonly instrumentCode: string;
    readonly instrumentSymbol: string;
}

export const AccountCard = (props: Props) => {
    const { type } = props;

    if (type === AccountTypeEnum.DEBT) {
        return <DebtAccountCard {...props} />;
    }

    if (type === AccountTypeEnum.BANK_SYNC) {
        return <SyncAccountCard {...props} />;
    }

    if (type === AccountTypeEnum.CRYPTO || type === AccountTypeEnum.CRYPTO_SYNC) {
        return <CryptoAccountCard {...props} />;
    }

    return <AccountCardBase {...props} />;
};
