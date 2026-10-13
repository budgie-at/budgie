import { isPositiveNumber } from '@rnw-community/shared';

import type { DebtProgressDisplayStateInterface } from '../interface/debt-progress-display-state.interface';
import type { DebtAccountProgressSummaryInterface } from '@budgie/contracts';

const isVisibleAmount = (amount: number, decimalPlaces: number): boolean => isPositiveNumber(Math.round(amount * 10 ** decimalPlaces));

export const getDebtProgressDisplayState = (
    summary: Pick<DebtAccountProgressSummaryInterface, 'outstandingAmount' | 'overpaidAmount' | 'totalAmount'>,
    decimalPlaces: number
): DebtProgressDisplayStateInterface => ({
    isSettled: isVisibleAmount(summary.totalAmount, decimalPlaces) && !isVisibleAmount(summary.outstandingAmount, decimalPlaces),
    isOverpaid: isVisibleAmount(summary.overpaidAmount, decimalPlaces)
});
