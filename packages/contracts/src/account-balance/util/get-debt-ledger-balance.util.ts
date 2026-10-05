import { isPositiveNumber } from '@rnw-community/shared';

import { isBorrowLikeDebtType } from '../../account/util/is-borrow-like-debt-type.util';

import { getDebtClosedAmount } from './get-debt-closed-amount.util';

import type { AccountDebtTypeEnum } from '../../account/enum/account-debt-type.enum';

export const getDebtLedgerBalance = (returnedAmount: number, debtType: AccountDebtTypeEnum, targetBalance: number): number => {
    const remainingAmount = Math.max(targetBalance - getDebtClosedAmount(returnedAmount, targetBalance), 0);

    if (!isBorrowLikeDebtType(debtType) || !isPositiveNumber(remainingAmount)) {
        return remainingAmount;
    }

    return -remainingAmount;
};
