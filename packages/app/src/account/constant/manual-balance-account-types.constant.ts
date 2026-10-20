import { AccountTypeEnum } from '@budgie/contracts';

export const MANUAL_BALANCE_ACCOUNT_TYPES: ReadonlySet<AccountTypeEnum> = new Set([
    AccountTypeEnum.CASH,
    AccountTypeEnum.BANK,
    AccountTypeEnum.SAVINGS,
    AccountTypeEnum.DEPOSIT,
    AccountTypeEnum.CRYPTO,
    AccountTypeEnum.STOCKS
]);
