import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { CryptoReturnInterface } from '../interface/crypto-return.interface';
import type { CryptoPositionInterface } from '@budgie/market';

const DISPLAY_ZERO_THRESHOLD = 0.005;
const PERCENT = 100;

const normalizeDisplayValue = (value: number): number => (Math.abs(value) < DISPLAY_ZERO_THRESHOLD ? 0 : value);

export const calculateCryptoReturn = (position: CryptoPositionInterface, valuationRate: number | null): CryptoReturnInterface | null => {
    const { amount, costBasis } = position;

    if (!isDefined(valuationRate) || !isDefined(costBasis)) {
        return null;
    }

    const profit = normalizeDisplayValue(amount * valuationRate - costBasis);

    return {
        profit,
        percent: isPositiveNumber(costBasis) ? normalizeDisplayValue((profit / costBasis) * PERCENT) : null
    };
};
