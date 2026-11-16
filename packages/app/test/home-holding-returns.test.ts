import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { HomeSectionKindEnum } from '../src/account/enum/home-section-kind.enum';
import { isAccountTypeSection } from '../src/account/type-guard/is-account-type-section.type-guard';
import { isHomeHolding } from '../src/account/type-guard/is-home-holding.type-guard';
import { getSuppressedHomeReturns } from '../src/account/utils/get-suppressed-home-returns.util';
import { hasKnownCostBasis } from '../src/account/utils/has-known-cost-basis.util';
import { hideEmptyHomeHoldings } from '../src/account/utils/hide-empty-home-holdings.util';
import { summarizeHoldingPositions } from '../src/account/utils/summarize-holding-positions.util';
import { calculatePortfolioReturn } from '../src/brokerage/utils/calculate-portfolio-return.util';
import { DEFAULT_INSTRUMENT } from '../src/settings/constants/default-instrument.constant';

const instrumentOf = (id: number, code: string, type = InstrumentTypeEnum.CRYPTO) => ({
    ...DEFAULT_INSTRUMENT,
    id,
    code,
    symbol: code,
    type
});

const holdingOf = (id: number, code: string, balance: number, value: number) => ({
    instrument: instrumentOf(id, code),
    accounts: [],
    balance,
    value,
    isValued: true
});

const positionOf = (amount: number, costBasis: number | null, realizedProfitLoss: number) => ({
    amount,
    costBasis,
    realizedProfitLoss,
    averageCost: null
});

it.effect('keeps a sold-out holding for returns while hiding its row', () =>
    Effect.sync(() => {
        const held = holdingOf(10, 'AAA', 1, 150);
        const soldOut = holdingOf(11, 'BBB', 0, 0);
        const section = hideEmptyHomeHoldings(
            { kind: HomeSectionKindEnum.ACCOUNT_TYPE, type: AccountTypeEnum.STOCKS, total: 150, hiddenHoldings: [], data: [held, soldOut] },
            2
        );

        expect(isAccountTypeSection(section)).toBe(true);
        expect(isAccountTypeSection(section) && section.data.filter(isHomeHolding)).toEqual([held]);
        expect(isAccountTypeSection(section) && section.hiddenHoldings).toEqual([soldOut]);

        const positions = [
            { value: 150, balance: 1, isValued: true, position: positionOf(1, 100, 0) },
            { value: 0, balance: 0, isValued: true, position: positionOf(0, null, 25) }
        ];
        const portfolio = calculatePortfolioReturn(positions, 0, 0);

        expect(portfolio.gain).toBe(75);
        expect(portfolio.percent).toBeCloseTo(1);
        expect(hasKnownCostBasis(positions, portfolio.positionReturns)).toBe(true);
    })
);

it.effect('shows an aggregate return only when known cost basis covers half the value', () =>
    Effect.sync(() => {
        const covered = [{ value: 600 }, { value: 400 }];

        expect(hasKnownCostBasis(covered, [{ gain: 100, costBasis: 500 }, null])).toBe(true);
        expect(hasKnownCostBasis(covered, [null, { gain: 40, costBasis: 260 }])).toBe(false);
        expect(hasKnownCostBasis([{ value: 0 }], [null])).toBe(true);
    })
);

it.effect('names the single visible position and counts only visible ones', () =>
    Effect.sync(() => {
        const accounts = [
            { instrument: instrumentOf(20, 'FDUSD') },
            { instrument: instrumentOf(21, 'ETH') },
            { instrument: instrumentOf(21, 'ETH') },
            { instrument: DEFAULT_INSTRUMENT }
        ];

        expect(summarizeHoldingPositions(accounts, () => false)).toEqual({ positionCount: 0, positionName: null });
        expect(summarizeHoldingPositions(accounts, instrumentId => instrumentId === 21)).toEqual({ positionCount: 1, positionName: 'ETH' });
        expect(summarizeHoldingPositions(accounts, () => true)).toEqual({ positionCount: 2, positionName: null });
        expect(summarizeHoldingPositions([{ instrument: instrumentOf(30, 'YAHOO:AAPL', InstrumentTypeEnum.EQUITY) }], () => true)).toEqual({
            positionCount: 1,
            positionName: 'YAHOO:AAPL'
        });
    })
);

it.effect('decides suppressed returns from structure alone', () =>
    Effect.sync(() => {
        const brokerAccount = { integrationId: 7 };
        const suppressed = getSuppressedHomeReturns([
            { holdings: [{ instrument: instrumentOf(1, 'BTC'), accounts: [{ integrationId: null }] }], cashProviders: [] },
            {
                holdings: [
                    { instrument: instrumentOf(2, 'AAPL'), accounts: [brokerAccount] },
                    { instrument: instrumentOf(3, 'TSLA'), accounts: [brokerAccount] }
                ],
                cashProviders: [{ integrationId: 7 }]
            },
            {
                holdings: [
                    { instrument: instrumentOf(4, 'VWCE'), accounts: [{ integrationId: 8 }] },
                    { instrument: instrumentOf(5, 'MSFT'), accounts: [{ integrationId: 9 }] }
                ],
                cashProviders: [{ integrationId: 8 }, { integrationId: 9 }]
            }
        ]);

        expect([...suppressed.instrumentIds]).toEqual([1]);
        expect([...suppressed.integrationIds]).toEqual([7]);
    })
);
