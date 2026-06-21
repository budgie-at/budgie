import { AccountDebtTypeEnum } from '@budgie/contracts';

import { isPositiveNumber } from '@rnw-community/shared';

import type { DebtAccountProgressSummaryParamsInterface } from '../interface/debt-account-progress-summary-params.interface';

const getInitialClosedAmount = (balance: number, debtType: AccountDebtTypeEnum, targetAmount: number): number => {
    if (debtType === AccountDebtTypeEnum.LENT) {
        return balance < 0 ? targetAmount : Math.max(balance, 0);
    }

    return Math.max(balance, 0);
};

const getInitialOutstandingAmount = (balance: number, debtType: AccountDebtTypeEnum): number =>
    debtType === AccountDebtTypeEnum.BORROW && balance < 0 ? -balance : 0;

const hasLedgerMovement = ({
    closedAmount,
    openedExtraAmount,
    openedPrincipalAmount
}: DebtAccountProgressSummaryParamsInterface): boolean =>
    isPositiveNumber(closedAmount) || isPositiveNumber(openedExtraAmount) || isPositiveNumber(openedPrincipalAmount);

const getMovementDebtBasisAmount = (
    { balance, openedExtraAmount, openedPrincipalAmount, targetAmount }: DebtAccountProgressSummaryParamsInterface,
    initialOutstandingAmount: number
): number =>
    balance === 0
        ? Math.max(targetAmount, openedPrincipalAmount) + openedExtraAmount
        : Math.max(targetAmount, initialOutstandingAmount) + openedPrincipalAmount + openedExtraAmount;

const getSyntheticPrincipalClosedAmount = ({
    balance,
    openedPrincipalAmount,
    targetAmount
}: DebtAccountProgressSummaryParamsInterface): number =>
    balance === 0 && isPositiveNumber(openedPrincipalAmount) ? Math.max(targetAmount - openedPrincipalAmount, 0) : 0;

const getActualClosedAmount = (initialClosedAmount: number, movementClosedAmount: number): number =>
    Math.max(initialClosedAmount + movementClosedAmount, 0);

const getNoMovementOutstandingAmount = (initialOutstandingAmount: number, targetAmount: number, initialClosedAmount: number): number =>
    isPositiveNumber(initialOutstandingAmount) ? initialOutstandingAmount : Math.max(targetAmount - initialClosedAmount, 0);

const getSettlementBasisAmount = (
    params: DebtAccountProgressSummaryParamsInterface,
    initialClosedAmount: number,
    movementClosedAmount: number
): number => Math.max(initialClosedAmount + getSyntheticPrincipalClosedAmount(params) + movementClosedAmount, 0);

const getOutstandingAmount = (
    params: DebtAccountProgressSummaryParamsInterface,
    initialClosedAmount: number,
    initialOutstandingAmount: number
): number => {
    if (!hasLedgerMovement(params)) {
        return getNoMovementOutstandingAmount(initialOutstandingAmount, params.targetAmount, initialClosedAmount);
    }

    return Math.max(
        getMovementDebtBasisAmount(params, initialOutstandingAmount) -
            getSettlementBasisAmount(params, initialClosedAmount, params.closedAmount),
        0
    );
};

const getTotalAmount = (
    params: DebtAccountProgressSummaryParamsInterface,
    initialClosedAmount: number,
    initialOutstandingAmount: number,
    actualClosedAmount: number
): number => {
    if (!hasLedgerMovement(params)) {
        return Math.max(params.targetAmount, initialOutstandingAmount, initialClosedAmount, 0);
    }

    return Math.max(getMovementDebtBasisAmount(params, initialOutstandingAmount), actualClosedAmount, 0);
};

export const buildDebtAccountProgressSummary = ({
    balance,
    closedAmount: movementClosedAmount,
    debtType,
    openedExtraAmount,
    openedPrincipalAmount,
    targetAmount
}: DebtAccountProgressSummaryParamsInterface) => {
    const params = { balance, closedAmount: movementClosedAmount, debtType, openedExtraAmount, openedPrincipalAmount, targetAmount };
    const initialClosedAmount = getInitialClosedAmount(balance, debtType, targetAmount);
    const initialOutstandingAmount = getInitialOutstandingAmount(balance, debtType);
    const actualClosedAmount = getActualClosedAmount(initialClosedAmount, movementClosedAmount);
    const openedAmount = openedPrincipalAmount + openedExtraAmount;
    const outstandingAmount = getOutstandingAmount(params, initialClosedAmount, initialOutstandingAmount);
    const totalAmount = getTotalAmount(params, initialClosedAmount, initialOutstandingAmount, actualClosedAmount);
    const paidAmount = Math.max(totalAmount - outstandingAmount, 0);
    const percentage = isPositiveNumber(totalAmount) ? Math.min(Number(((paidAmount / totalAmount) * 100).toFixed(2)), 100) : 0;

    return {
        closedAmount: actualClosedAmount,
        openedAmount,
        outstandingAmount,
        paidAmount,
        totalAmount,
        percentage
    };
};
