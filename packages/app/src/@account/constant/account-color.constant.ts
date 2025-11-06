import { AccountTypeEnum } from '@budgie/contracts';

export const ACCOUNT_COLOR: Record<AccountTypeEnum, string> = {
    [AccountTypeEnum.BANK]: 'text-default-foreground',
    [AccountTypeEnum.CASH]: 'text-positive-foreground',
    [AccountTypeEnum.CRYPTO]: 'text-warning-foreground',
    [AccountTypeEnum.STOCKS]: 'text-pink-foreground'
};
