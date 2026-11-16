import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { HoldingReturnInterface } from '../interface/holding-return.interface';
import type { HomeHoldingInterface } from '../interface/home-holding.interface';

const MIN_KNOWN_COST_BASIS_SHARE = 0.5;

export const hasKnownCostBasis = (
    positions: readonly Pick<HomeHoldingInterface, 'value'>[],
    positionReturns: readonly (HoldingReturnInterface | null)[]
): boolean => {
    const totalValue = positions.reduce((sum, { value }) => sum + Math.max(value, 0), 0);
    const knownValue = positionReturns.filter(isDefined).reduce((sum, { gain, costBasis }) => sum + gain + costBasis, 0);

    return !isPositiveNumber(totalValue) || knownValue >= totalValue * MIN_KNOWN_COST_BASIS_SHARE;
};
