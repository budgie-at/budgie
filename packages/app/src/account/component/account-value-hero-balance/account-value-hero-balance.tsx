import { useAccountHeroValue } from '../../hook/use-account-hero-value.hook';
import { AccountDetailsHeroBalance } from '../account-details-hero-balance/account-details-hero-balance';

import type { AccountHeroValueInterface } from '../../interface/account-hero-value.interface';

export const AccountValueHeroBalance = ({ balance, account }: AccountHeroValueInterface) => {
    const heroValue = useAccountHeroValue(account, balance);

    return <AccountDetailsHeroBalance balance={heroValue.balance} account={heroValue.account} />;
};
