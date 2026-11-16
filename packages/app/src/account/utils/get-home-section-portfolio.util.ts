import { isDefined, isNotEmptyArray } from '@rnw-community/shared';

import { calculatePortfolioReturn } from '../../brokerage/utils/calculate-portfolio-return.util';

import { hasKnownCostBasis } from './has-known-cost-basis.util';

import type { HoldingReturnInterface } from '../interface/holding-return.interface';
import type { HomeHoldingSectionInterface } from '../interface/home-holding-section.interface';
import type { InstrumentPositionInterface } from '@budgie/market';

export const getHomeSectionPortfolio = (
    section: Pick<HomeHoldingSectionInterface, 'returnHoldings' | 'cashProviders'>,
    getPosition: (instrumentId: number, accountIds: readonly number[]) => InstrumentPositionInterface | null,
    cashReturns: ReadonlyMap<number, number>,
    suppressedInstrumentIds: ReadonlySet<number>
) => {
    const positions = section.returnHoldings.map(holding => ({
        ...holding,
        position: getPosition(
            holding.instrument.id,
            holding.accounts.map(account => account.id)
        )
    }));
    const portfolio = calculatePortfolioReturn(
        positions,
        section.cashProviders.reduce((sum, institution) => sum + institution.cash, 0),
        section.cashProviders.reduce((sum, institution) => sum + (cashReturns.get(institution.integrationId) ?? 0), 0)
    );
    const knownReturns = positions.flatMap(({ instrument, value }, index): [number, HoldingReturnInterface][] => {
        const holdingReturn = portfolio.positionReturns[index];

        return isDefined(holdingReturn) && hasKnownCostBasis([{ value }], [holdingReturn]) ? [[instrument.id, holdingReturn]] : [];
    });
    const hasReturn = hasKnownCostBasis(positions, portfolio.positionReturns) && (isNotEmptyArray(knownReturns) || portfolio.gain !== 0);

    return {
        portfolio,
        hasReturn,
        holdingReturns: new Map(knownReturns.filter(([instrumentId]) => !suppressedInstrumentIds.has(instrumentId)))
    };
};
