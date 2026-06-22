import { AccountTypeEnum, AccountWithBankSyncEntityInterface, BankSyncEntityInterface } from '@budgie/contracts';

import { AccountCardBase } from '../account-card-base/account-card-base';
import { BankSyncAccountCard } from '../bank-sync-account-card/bank-sync-account-card';
import { CryptoAccountCard } from '../crypto-account-card/crypto-account-card';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';

interface Props extends Pick<
    AccountWithBankSyncEntityInterface,
    'id' | 'createdAt' | 'title' | 'type' | 'icon' | 'externalId' | 'debtType' | 'targetBalance' | 'deadline'
> {
    readonly balance: number;
    readonly bankSync: BankSyncEntityInterface | null;
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
        return <BankSyncAccountCard {...props} />;
    }

    if (type === AccountTypeEnum.CRYPTO) {
        return <CryptoAccountCard {...props} />;
    }

    return <AccountCardBase {...props} />;
};
