import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';

export const ACCOUNT_DEBT_TYPE_ICON: Record<AccountDebtTypeEnum, UserIconNameEnum> = {
    [AccountDebtTypeEnum.LENT]: UserIconNameEnum.TrendingDown,
    [AccountDebtTypeEnum.BORROW]: UserIconNameEnum.TrendingUp
};
