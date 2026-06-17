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
    const openedAmount = debtType === AccountDebtTypeEnum.BORROW ? creditAmount : debitAmount;
    const signedOutstandingAmount = debtType === AccountDebtTypeEnum.BORROW ? -balance : balance;
    const observedOutstandingAmount = Math.max(signedOutstandingAmount, 0);
    const observedTotalAmount = Math.max(openedAmount, closedAmount + observedOutstandingAmount);
    const hasDebtActivity = isPositiveNumber(Math.abs(balance)) || isPositiveNumber(openedAmount) || isPositiveNumber(closedAmount);
    const totalAmount = hasDebtActivity ? Math.max(targetAmount, observedTotalAmount, 0) : Math.max(targetAmount, 0);
    const outstandingAmount = hasDebtActivity ? observedOutstandingAmount : totalAmount;
    const paidAmount = Math.min(Math.max(totalAmount - outstandingAmount, 0), totalAmount);
    const percentage = isPositiveNumber(totalAmount) ? Math.min(Number(((paidAmount / totalAmount) * 100).toFixed(2)), 100) : 0;

    return {
        outstandingAmount,
        paidAmount,
        totalAmount,
        percentage
    };
};
