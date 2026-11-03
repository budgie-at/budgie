import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';
import { msg } from '@lingui/core/macro';

import type { OnboardingAccountOptionDescriptorInterface } from '../interface/onboarding-account-option-descriptor.interface';

export const ONBOARDING_ACCOUNT_OPTIONS: readonly OnboardingAccountOptionDescriptorInterface[] = [
    { type: AccountTypeEnum.CASH, icon: UserIconNameEnum.Wallet, title: msg`Cash` },
    { type: AccountTypeEnum.BANK, icon: UserIconNameEnum.Landmark, title: msg`Bank account` },
    { type: AccountTypeEnum.SAVINGS, icon: UserIconNameEnum.PiggyBank, title: msg`Savings` },
    { type: AccountTypeEnum.DEPOSIT, icon: UserIconNameEnum.Vault, title: msg`Deposits` },
    { type: AccountTypeEnum.CRYPTO, icon: UserIconNameEnum.Bitcoin, title: msg`Crypto` },
    { type: AccountTypeEnum.STOCKS, icon: UserIconNameEnum.ChartLine, title: msg`Stocks` },
    { type: AccountTypeEnum.DEBT, icon: UserIconNameEnum.HandCoins, title: msg`Debts and loans` }
];
