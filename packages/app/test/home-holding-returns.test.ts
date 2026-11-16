import { AccountTypeEnum, InstrumentTypeEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { HomeReturnSlotStateEnum } from '../src/account/enum/home-return-slot-state.enum';
import { HomeSectionKindEnum } from '../src/account/enum/home-section-kind.enum';
import { isAccountTypeSection } from '../src/account/type-guard/is-account-type-section.type-guard';
import { isHomeHolding } from '../src/account/type-guard/is-home-holding.type-guard';
import { getHiddenProviderCashAccountIds } from '../src/account/utils/get-hidden-provider-cash-account-ids.util';
import { getHomeSectionPortfolio } from '../src/account/utils/get-home-section-portfolio.util';
import { getSuppressedHomeReturns } from '../src/account/utils/get-suppressed-home-returns.util';
import { hasKnownCostBasis } from '../src/account/utils/has-known-cost-basis.util';
import { hideEmptyHomeHoldings } from '../src/account/utils/hide-empty-home-holdings.util';
import { resolveHomeReturnSlotState } from '../src/account/utils/resolve-home-return-slot-state.util';
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
            {
                kind: HomeSectionKindEnum.ACCOUNT_TYPE,
                type: AccountTypeEnum.STOCKS,
                total: 150,
                hiddenHoldings: [],
                holdingProviders: [],
                data: [held, soldOut]
            },
            new Map(),
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

it.effect('suppresses the return of a sole holding in its section', () =>
    Effect.sync(() => {
        const suppressed = getSuppressedHomeReturns([
            { holdings: [{ instrument: instrumentOf(1, 'BTC') }] },
            { holdings: [{ instrument: instrumentOf(2, 'AAPL') }, { instrument: instrumentOf(3, 'TSLA') }] }
        ]);

        expect([...suppressed]).toEqual([1]);
    })
);

it.effect('keeps the section return of a single holding at break-even while its row return is suppressed', () =>
    Effect.sync(() => {
        const result = getHomeSectionPortfolio(
            { returnHoldings: [holdingOf(40, 'BTC', 1, 100)], cashProviders: [] },
            () => positionOf(1, 100, 0),
            new Map(),
            new Set([40])
        );

        expect(result.hasReturn).toBe(true);
        expect(result.portfolio.gain).toBe(0);
        expect(result.portfolio.percent).toBe(0);
        expect(result.holdingReturns.size).toBe(0);
    })
);

it.effect('keeps a return slot through loading unless the return is structurally suppressed', () =>
    Effect.sync(() => {
        expect(resolveHomeReturnSlotState(false, true, true, false)).toBe(HomeReturnSlotStateEnum.PENDING);
        expect(resolveHomeReturnSlotState(false, true, false, true)).toBe(HomeReturnSlotStateEnum.RESERVED);
        expect(resolveHomeReturnSlotState(false, false, false, true)).toBe(HomeReturnSlotStateEnum.RESERVED);
        expect(resolveHomeReturnSlotState(false, true, false, false)).toBe(HomeReturnSlotStateEnum.SHOWN);
        expect(resolveHomeReturnSlotState(true, true, true, true)).toBe(HomeReturnSlotStateEnum.ABSENT);
        expect(resolveHomeReturnSlotState(true, false, false, true)).toBe(HomeReturnSlotStateEnum.RESERVED);
    })
);

it.effect('keeps a broker cash row as the entry point until the broker shows a position', () =>
    Effect.sync(() => {
        const cash = { id: 1, instrument: instrumentOf(1, 'USD', InstrumentTypeEnum.FIAT) };
        const security = { id: 2, instrument: instrumentOf(30, 'YAHOO:BGTX', InstrumentTypeEnum.EQUITY) };
        const balanceOf = (balance: number, convertedBalance: number) => ({ balance, convertedBalance, isValued: true });
        const hiddenFor = (accounts: readonly (typeof cash)[], balances: [number, ReturnType<typeof balanceOf>][]) => [
            ...getHiddenProviderCashAccountIds([{ accounts }], new Map(balances), 2)
        ];

        expect(hiddenFor([cash], [[1, balanceOf(0, 0)]])).toEqual([]);
        expect(
            hiddenFor(
                [cash, security],
                [
                    [1, balanceOf(0, 0)],
                    [2, balanceOf(0, 0)]
                ]
            )
        ).toEqual([]);
        expect(
            hiddenFor(
                [cash, security],
                [
                    [1, balanceOf(0, 0)],
                    [2, balanceOf(0.000001, 0.001)]
                ]
            )
        ).toEqual([]);
        expect(
            hiddenFor(
                [cash, security],
                [
                    [1, balanceOf(0, 0)],
                    [2, balanceOf(10, 1200)]
                ]
            )
        ).toEqual([1]);
        expect(
            hiddenFor(
                [cash, security],
                [
                    [1, balanceOf(50, 50)],
                    [2, balanceOf(10, 1200)]
                ]
            )
        ).toEqual([]);
    })
);
