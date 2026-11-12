import { convertToMicroUnits } from '@budgie/contracts';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { InstrumentReturnInterface } from '../interface/instrument-return.interface';
import type { InstrumentPositionInterface } from '@budgie/market';

const DISPLAY_ZERO_THRESHOLD = 0.005;
const PERCENT = 100;

const normalizeDisplayValue = (value: number): number => (Math.abs(value) < DISPLAY_ZERO_THRESHOLD ? 0 : value);

export const calculateInstrumentReturn = (
    position: InstrumentPositionInterface,
    valuationRate: number | null,
    balance: number
): InstrumentReturnInterface | null => {
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
