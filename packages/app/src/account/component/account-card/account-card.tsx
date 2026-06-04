import { AccountEntityInterface, AccountTypeEnum } from '@budgie/contracts';

import { AccountCardBase } from '../account-card-base/account-card-base';
import { BankSyncAccountCard } from '../bank-sync-account-card/bank-sync-account-card';
import { DebtAccountCard } from '../debt-account-card/debt-account-card';

interface Props extends Pick<
    AccountEntityInterface,
    'id' | 'createdAt' | 'title' | 'type' | 'icon' | 'debtType' | 'targetBalance' | 'deadline'
> {
    readonly className?: string;
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

    return <AccountCardBase {...props} />;
};
