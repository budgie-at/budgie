import { AccountDebtTypeEnum, UserIconNameEnum } from '@budgie/contracts';

import { isNotEmptyString } from '@rnw-community/shared';

import type { DebtSettlementAccountInterface } from '../interface/debt-settlement-account.interface';

const DEBT_SETTLEMENT_ICON: Record<AccountDebtTypeEnum, UserIconNameEnum> = {
    [AccountDebtTypeEnum.LENT]: UserIconNameEnum.HandCoins,
    [AccountDebtTypeEnum.BORROW]: UserIconNameEnum.HandCoins,
    [AccountDebtTypeEnum.INSTALLMENT]: UserIconNameEnum.CalendarClock
};

export const getDebtSettlementIcon = (account: DebtSettlementAccountInterface) => {
    const hasOwnIcon = account.debtType === AccountDebtTypeEnum.INSTALLMENT && isNotEmptyString(account.icon);

    return hasOwnIcon ? account.icon : DEBT_SETTLEMENT_ICON[account.debtType];
};
