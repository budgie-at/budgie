import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

export const ACCOUNT_ICON: Record<AccountTypeEnum, UserIconNameEnum> = {
    [AccountTypeEnum.BANK]: UserIconNameEnum.CreditCard,
    [AccountTypeEnum.CASH]: UserIconNameEnum.Wallet,
    [AccountTypeEnum.DEBT]: UserIconNameEnum.HandCoins,
    [AccountTypeEnum.CRYPTO]: UserIconNameEnum.Coins,
    [AccountTypeEnum.STOCKS]: UserIconNameEnum.CreditCard,
    [AccountTypeEnum.SAVINGS]: UserIconNameEnum.Coins,
    [AccountTypeEnum.BANK_SYNC]: UserIconNameEnum.CreditCard
};
