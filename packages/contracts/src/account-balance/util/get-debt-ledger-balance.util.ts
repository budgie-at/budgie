import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';

import { getDebtClosedAmount } from './get-debt-closed-amount.util';

export const getDebtLedgerBalance = (returnedAmount: number, debtType: AccountDebtTypeEnum, targetBalance: number): number => {
    const closedAmount = getDebtClosedAmount(returnedAmount, targetBalance);

    if (debtType === AccountDebtTypeEnum.LENT) {
        return closedAmount;
    }

    return closedAmount - targetBalance;
};
