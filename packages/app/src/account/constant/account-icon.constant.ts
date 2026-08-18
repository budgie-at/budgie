import { AccountTypeEnum, UserIconNameEnum } from '@budgie/contracts';

export const ACCOUNT_ICON: Record<AccountTypeEnum, UserIconNameEnum> = {
    [AccountTypeEnum.BANK]: UserIconNameEnum.CreditCard,
    [AccountTypeEnum.CASH]: UserIconNameEnum.PiggyBank,
    [AccountTypeEnum.DEBT]: UserIconNameEnum.HandCoins,
    [AccountTypeEnum.CRYPTO]: UserIconNameEnum.Coins,
    [AccountTypeEnum.STOCKS]: UserIconNameEnum.CreditCard,
    [AccountTypeEnum.SAVINGS]: UserIconNameEnum.PiggyBank,
    [AccountTypeEnum.DEPOSIT]: UserIconNameEnum.Landmark,
    [AccountTypeEnum.BANK_SYNC]: UserIconNameEnum.CreditCard,
    [AccountTypeEnum.CRYPTO_SYNC]: UserIconNameEnum.Bitcoin
};
