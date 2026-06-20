import { AccountDebtTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import type { DebtAccountProgressSummaryParamsInterface } from '../interface/debt-account-progress-summary-params.interface';

const getInitialClosedAmount = (balance: number, debtType: AccountDebtTypeEnum, targetAmount: number): number => {
    if (debtType === AccountDebtTypeEnum.LENT) {
        return balance < 0 ? targetAmount : Math.max(balance, 0);
    }

    return Math.max(balance, 0);
};

export const buildDebtAccountProgressSummary = ({
    balance,
    closedAmount: movementClosedAmount,
    debtType,
    openedExtraAmount,
    openedPrincipalAmount,
    targetAmount
}: DebtAccountProgressSummaryParamsInterface) => {
    const initialClosedAmount = getInitialClosedAmount(balance, debtType, targetAmount);
    const initialOutstandingAmount = debtType === AccountDebtTypeEnum.BORROW && balance < 0 ? -balance : 0;
    const closedAmount = Math.max(initialClosedAmount + movementClosedAmount, 0);
    const openedBasisAmount = Math.max(initialOutstandingAmount + openedPrincipalAmount, 0);
    const openedAmount = openedPrincipalAmount + openedExtraAmount;
    const effectiveDebtBasisAmount = isPositiveNumber(openedBasisAmount)
        ? openedBasisAmount + openedExtraAmount
        : targetAmount + openedExtraAmount;
    const totalAmount = Math.max(targetAmount + openedExtraAmount, openedBasisAmount + openedExtraAmount, closedAmount, 0);
    const outstandingAmount = Math.max(effectiveDebtBasisAmount - closedAmount, 0);
    const paidAmount = Math.max(totalAmount - outstandingAmount, 0);
    const percentage = isPositiveNumber(totalAmount) ? Math.min(Number(((paidAmount / totalAmount) * 100).toFixed(2)), 100) : 0;

    return {
        closedAmount,
        openedAmount,
        outstandingAmount,
        paidAmount,
        totalAmount,
        percentage
    };
};
