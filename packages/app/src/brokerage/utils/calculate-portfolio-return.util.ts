import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import type { PortfolioPositionInterface } from '../interface/portfolio-position.interface';
import type { PortfolioReturnInterface } from '../interface/portfolio-return.interface';

export const calculatePortfolioReturn = (
    positions: readonly PortfolioPositionInterface[],
    cash: number,
    cashReturn: number
): PortfolioReturnInterface => {
    const knownShares = positions.map(({ balance, isValued, position }) =>
        isValued && isDefined(position?.costBasis) && isPositiveNumber(balance) ? Math.min(position.amount / balance, 1) : null
    );
    const positionGains = positions.map(({ value, position }, index) => {
        const knownShare = knownShares[index];

        return isDefined(knownShare) && isDefined(position?.costBasis) ? value * knownShare - position.costBasis : null;
    });
    const gain = positions.reduce(
        (total, { position }, index) => total + (position?.realizedProfitLoss ?? 0) + (positionGains[index] ?? 0),
        cashReturn
    );
    const unknownBasisValue = positions.reduce((total, { value }, index) => total + value * (1 - (knownShares[index] ?? 0)), 0);
    const moneyIn = positions.reduce((total, { value }) => total + value, cash) - gain - unknownBasisValue;

    return { gain, percent: isPositiveNumber(moneyIn) ? gain / moneyIn : null, positionGains };
};
