import { AccountDebtTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import type { DebtAccountProgressSummaryParamsInterface } from '../interface/debt-account-progress-summary-params.interface';

export const buildDebtAccountProgressSummary = ({
    balance,
    creditAmount,
    debitAmount,
    debtType,
    targetAmount
}: DebtAccountProgressSummaryParamsInterface) => {
    const closedAmount = debtType === AccountDebtTypeEnum.BORROW ? debitAmount : creditAmount;
    const signedOutstandingAmount = debtType === AccountDebtTypeEnum.BORROW ? -balance : balance;
    const observedOutstandingAmount = Math.max(signedOutstandingAmount, 0);
    const observedTotalAmount = closedAmount + observedOutstandingAmount;
    const totalAmount = isPositiveNumber(observedTotalAmount) ? observedTotalAmount : Math.max(targetAmount, 0);
    const paidAmount = Math.min(closedAmount, totalAmount);
    const outstandingAmount = isPositiveNumber(observedTotalAmount) ? observedOutstandingAmount : totalAmount;
    const percentage = isPositiveNumber(totalAmount) ? Math.min(Number(((paidAmount / totalAmount) * 100).toFixed(2)), 100) : 0;

    return {
        outstandingAmount,
        paidAmount,
        totalAmount,
        percentage
    };
};
