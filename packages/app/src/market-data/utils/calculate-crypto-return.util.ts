import { convertToMicroUnits } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { CryptoReturnInterface } from '../interface/crypto-return.interface';
import type { CryptoPositionInterface } from '@budgie/market';

const DISPLAY_ZERO_THRESHOLD = 0.005;
const PERCENT = 100;

const normalizeDisplayValue = (value: number): number => (Math.abs(value) < DISPLAY_ZERO_THRESHOLD ? 0 : value);

export const calculateCryptoReturn = (
    position: CryptoPositionInterface,
    valuationRate: number | null,
    balance: number
): CryptoReturnInterface | null => {
    const { amount, costBasis } = position;

    const isCovered = isPositiveNumber(convertToMicroUnits(balance)) && convertToMicroUnits(amount) <= convertToMicroUnits(balance);

    if (!isDefined(valuationRate) || !isDefined(costBasis) || !isCovered) {
        return null;
    }

    const rawProfit = amount * valuationRate - costBasis;

    return {
        profit: normalizeDisplayValue(rawProfit),
        percent: isPositiveNumber(costBasis) ? normalizeDisplayValue((rawProfit / costBasis) * PERCENT) : null
    };
};
