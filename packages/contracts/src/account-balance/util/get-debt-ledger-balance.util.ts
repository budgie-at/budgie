import { isPositiveNumber } from '@rnw-community/shared';

import { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';

import { getDebtClosedAmount } from './get-debt-closed-amount.util';

export const getDebtLedgerBalance = (returnedAmount: number, debtType: AccountDebtTypeEnum, targetBalance: number): number => {
    const remainingAmount = Math.max(targetBalance - getDebtClosedAmount(returnedAmount, targetBalance), 0);

    if (debtType === AccountDebtTypeEnum.LENT || !isPositiveNumber(remainingAmount)) {
        return remainingAmount;
    }

    return -remainingAmount;
};
