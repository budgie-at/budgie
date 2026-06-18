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
    const hasLedgerActivity = isPositiveNumber(openedAmount) || isPositiveNumber(closedAmount);
    const ledgerOutstandingAmount = Math.max(openedAmount - closedAmount, 0);
    const signedFallbackOutstandingAmount = isPositiveNumber(signedOutstandingAmount) ? signedOutstandingAmount : 0;
    const targetOnlyOutstandingAmount = signedOutstandingAmount === 0 ? Math.max(targetAmount, 0) : 0;
    const fallbackOutstandingAmount = Math.max(signedFallbackOutstandingAmount, targetOnlyOutstandingAmount);
    const outstandingAmount = hasLedgerActivity ? ledgerOutstandingAmount : fallbackOutstandingAmount;
    const observedTotalAmount = hasLedgerActivity
        ? Math.max(openedAmount, closedAmount, closedAmount + outstandingAmount)
        : outstandingAmount;
    const totalAmount = Math.max(targetAmount, observedTotalAmount, 0);
    const paidAmount = Math.min(Math.max(totalAmount - outstandingAmount, 0), totalAmount);
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
