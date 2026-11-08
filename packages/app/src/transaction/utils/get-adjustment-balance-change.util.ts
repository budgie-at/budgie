import { convertFromMicroUnits, convertToMicroUnits } from '@budgie/contracts';

import type { AdjustmentTransactionDetailsInterface } from '../interface/adjustment-transaction-details.interface';

export const getAdjustmentBalanceChange = (
    details: Pick<AdjustmentTransactionDetailsInterface, 'initialAmount' | 'initialIsIncrease' | 'isBalanceFixed'>,
    amount: number,
    isIncrease: boolean
): number => {
    if (details.isBalanceFixed) {
        return 0;
    }

    const original = details.initialIsIncrease ? details.initialAmount : -details.initialAmount;
    const proposed = isIncrease ? amount : -amount;

    return convertFromMicroUnits(convertToMicroUnits(proposed) - convertToMicroUnits(original));
};
