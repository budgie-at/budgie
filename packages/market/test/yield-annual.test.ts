import { AccountTypeEnum, InstrumentTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { addMonths } from 'date-fns/addMonths';
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import * as Effect from 'effect/Effect';

import { YieldRangeEnum } from '../src/yield/enum/yield-range.enum';
import { YieldUnavailableReasonEnum } from '../src/yield/enum/yield-unavailable-reason.enum';

import {
    BASE_ID,
    DEPOSIT_ACCOUNT_ID,
    ETH_ACCOUNT_ID,
    ETH_AVERAGE_UNITS,
    ETH_ID,
    ETH_RATE,
    FUND_ACCOUNT_ID,
    FUND_ID,
    LUMPY_RATE,
    SOL_ACCOUNT_ID,
    SOL_ID,
    UAH_ID,
    USDT_ID,
    priceRange,
    deposit,
    ethStakingWorld,
    interest,
    lumpyDepositWorld,
    mergeWorlds,
    movement,
    position,
    solHolding,
    solPosition,
    summarize,
    valued
} from './yield-test-kit';

const toUsdt = { landingAccountId: 99, landingInstrumentId: USDT_ID, landingInstrumentCode: 'USDT' };
const ethHolding = { positions: [position()], movements: [movement(ETH_ACCOUNT_ID, '2025-01-01', 10)] };
const ethPrices = (price: number) => priceRange(ETH_ID, BASE_ID, ['2025-10-01', '2026-11-13'], price);
const solDistribution = valued('2026-06-01', 1, 50, {
    yieldKind: YieldKindEnum.DISTRIBUTION,
    positionAccountId: SOL_ACCOUNT_ID,
    landingAccountId: SOL_ACCOUNT_ID,
    landingInstrumentId: SOL_ID,
    landingInstrumentCode: 'SOL'
});

const fundWorld = (lastNavRangeEnd: string) => ({
    positions: [
        position({
            id: FUND_ACCOUNT_ID,
            title: 'Inzhur REIT',
            type: AccountTypeEnum.STOCKS,
            instrumentId: FUND_ID,
            instrumentCode: 'REIT',
            instrumentSymbol: 'REIT',
            instrumentType: InstrumentTypeEnum.FUND
        })
    ],
    movements: [movement(FUND_ACCOUNT_ID, '2024-01-01', 100)],
    prices: priceRange(FUND_ID, UAH_ID, ['2024-01-01', lastNavRangeEnd], 10, 30),
    facts: Array.from({ length: 12 }, (_, index) =>
        valued(format(addMonths(parseISO('2025-12-05'), index), 'yyyy-MM-dd'), 5, 5, {
            yieldKind: YieldKindEnum.DIVIDEND,
            landingAccountId: 99,
            landingInstrumentId: UAH_ID,
            landingInstrumentCode: 'UAH',
            landingInstrumentType: InstrumentTypeEnum.FIAT,
            positionAccountId: FUND_ACCOUNT_ID
        })
    )
});

describe('YieldService annual yield', () => {
    it.effect('unit mode divides reward units by average units and ignores prices', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({ ...ethStakingWorld, prices: [], latestRates: [] });

            expect(summary.annualYield.rate).toBeCloseTo(ETH_RATE, 6);
            expect(summary.annualYield).toMatchObject({ reason: null, isEstimated: false });
            expect(summary.positions.at(0)?.annualYield.rate).toBeCloseTo(ETH_RATE, 6);
        })
    );

    it.effect('value mode drops far-estimated days from both sides, and too many dropped days give no rate', () =>
        Effect.gen(function* () {
            const priced = yield* summarize(fundWorld('2026-10-01'), { baseInstrumentId: UAH_ID });
            const sparse = yield* summarize(fundWorld('2026-06-01'), { baseInstrumentId: UAH_ID });

            expect(priced.annualYield.rate).toBeCloseTo((55 / 1000) * (365 / 339), 6);
            expect(priced.annualYield.isEstimated).toBe(false);
            expect(sparse.annualYield).toMatchObject({ rate: null, reason: YieldUnavailableReasonEnum.NOT_ENOUGH_PRICES });
        })
    );

    it.effect('falls back to value mode when rewards arrive in another instrument', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({
                ...ethHolding,
                prices: ethPrices(2000),
                facts: [valued('2026-03-01', 400, 400, toUsdt), valued('2026-09-01', 400, 400, toUsdt)]
            });

            expect(summary.annualYield.rate).toBeCloseTo(0.04, 6);
        })
    );

    it.effect('excludes DISTRIBUTION and always uses the trailing 365 days whatever the range', () =>
        Effect.gen(function* () {
            const world = {
                ...ethStakingWorld,
                facts: [...(ethStakingWorld.facts ?? []), valued('2026-06-01', 5, 10000, { yieldKind: YieldKindEnum.DISTRIBUTION })]
            };
            const year = yield* summarize(world);
            const month = yield* summarize(world, { range: YieldRangeEnum.MONTH });

            expect(year.annualYield.rate).toBeCloseTo(ETH_RATE, 6);
            expect(month.annualYield.rate).toBeCloseTo(ETH_RATE, 6);
            expect(year.annualYield.excludesDistributions).toBe(true);
        })
    );

    it.effect('needs two payouts for a young interest position, then uses the explicit denominator', () =>
        Effect.gen(function* () {
            const one = yield* summarize({
                positions: [deposit()],
                movements: [movement(DEPOSIT_ACCOUNT_ID, '2026-05-01', 1000), movement(DEPOSIT_ACCOUNT_ID, '2026-08-01', 10)],
                facts: [interest('2026-08-01', 10)]
            });
            const two = yield* summarize(lumpyDepositWorld(null));

            expect(one.annualYield).toMatchObject({ rate: null, reason: YieldUnavailableReasonEnum.AWAITING_SECOND_PAYOUT });
            expect(two.annualYield.rate).toBeCloseTo(LUMPY_RATE, 6);
        })
    );

    it.effect('reports every other "—" reason', () =>
        Effect.gen(function* () {
            const young = yield* summarize({
                positions: [position()],
                movements: [movement(ETH_ACCOUNT_ID, '2026-11-01', 10)],
                facts: [valued('2026-11-05', 0.1, 200)]
            });
            const zeroValue = yield* summarize({ ...ethHolding, prices: ethPrices(0), facts: [valued('2026-03-01', 400, 400, toUsdt)] });
            const tooHigh = yield* summarize({ ...ethHolding, facts: [valued('2026-06-01', 20, 40000)] });

            expect([young, zeroValue, tooHigh].map(summary => summary.annualYield.reason)).toEqual([
                YieldUnavailableReasonEnum.UNDER_FOUR_WEEKS,
                YieldUnavailableReasonEnum.NO_AVERAGE,
                YieldUnavailableReasonEnum.UNUSUALLY_HIGH
            ]);
            expect(tooHigh.annualYield.rate).toBeNull();
        })
    );

    it.effect('counts "across n" and "on n of m" holdings by average value coverage', () =>
        Effect.gen(function* () {
            const partial = yield* summarize(mergeWorlds(ethStakingWorld, solHolding(100), { facts: [solDistribution] }));
            const covered = yield* summarize(mergeWorlds(ethStakingWorld, solHolding(10), { facts: [solDistribution] }));

            expect(partial.annualYield).toMatchObject({
                holdingCount: 1,
                totalCount: 2,
                isPartialCoverage: true,
                excludesDistributions: true
            });
            expect(covered.annualYield).toMatchObject({ holdingCount: 1, totalCount: 2, isPartialCoverage: false });
        })
    );

    it.effect('weights the combined yield by reward value over average value', () =>
        Effect.gen(function* () {
            const solToUsdt = { ...toUsdt, positionAccountId: SOL_ACCOUNT_ID };
            const summary = yield* summarize(
                mergeWorlds(ethStakingWorld, solHolding(100), {
                    facts: [valued('2026-03-01', 300, 300, solToUsdt), valued('2026-09-01', 300, 300, solToUsdt)]
                })
            );

            expect(summary.annualYield.rate).toBeCloseTo(1400 / (ETH_AVERAGE_UNITS * 2000 + 10000), 6);
            expect(summary.annualYield.holdingCount).toBe(2);
        })
    );

    it.effect('annualises the combined yield per position, so a short-history position cannot dilute a long one', () =>
        Effect.gen(function* () {
            const solReward = {
                positionAccountId: SOL_ACCOUNT_ID,
                landingAccountId: SOL_ACCOUNT_ID,
                landingInstrumentId: SOL_ID,
                landingInstrumentCode: 'SOL'
            };
            const youngSol = {
                positions: [solPosition],
                movements: [movement(SOL_ACCOUNT_ID, '2026-09-15', 203.3)],
                prices: priceRange(SOL_ID, BASE_ID, ['2025-10-01', '2026-11-13'], 100),
                facts: [valued('2026-10-15', 2, 200, solReward)]
            };
            const summary = yield* summarize(mergeWorlds(ethStakingWorld, youngSol));
            const rates = summary.positions.map(row => row.annualYield.rate ?? Number.NaN);
            const expected = (800 + (200 * 365) / 60) / (ETH_AVERAGE_UNITS * 2000 + 20330);

            expect(summary.annualYield.rate).toBeCloseTo(expected, 6);
            expect(summary.annualYield.rate).toBeGreaterThan(Math.min(...rates));
            expect(summary.annualYield.rate).toBeLessThan(Math.max(...rates));
        })
    );

    it.effect('leaves unpriced unit-mode positions out of the combined yield and its counts', () =>
        Effect.gen(function* () {
            const unpricedSol = {
                positions: [solPosition],
                movements: [movement(SOL_ACCOUNT_ID, '2025-01-01', 10)],
                facts: [
                    valued('2026-03-01', 1, 0, {
                        positionAccountId: SOL_ACCOUNT_ID,
                        landingAccountId: SOL_ACCOUNT_ID,
                        landingInstrumentId: SOL_ID,
                        landingInstrumentCode: 'SOL'
                    })
                ]
            };
            const summary = yield* summarize(mergeWorlds(ethStakingWorld, unpricedSol));

            expect(summary.annualYield).toMatchObject({ holdingCount: 1, totalCount: 1 });
            expect(summary.annualYield.rate).toBeCloseTo(ETH_RATE, 6);
        })
    );

    it.effect('annualises a lumpy value-mode position over its payout span, and drops it without prices', () =>
        Effect.gen(function* () {
            const payout = (day: string, value: number) =>
                valued(day, value, value, { ...toUsdt, yieldKind: YieldKindEnum.DIVIDEND, positionAccountId: SOL_ACCOUNT_ID });
            const world = (lastPriceDay: string) => ({
                positions: [solPosition],
                movements: [movement(SOL_ACCOUNT_ID, '2026-05-01', 100)],
                prices: priceRange(SOL_ID, BASE_ID, ['2026-04-01', lastPriceDay], 100),
                facts: [payout('2026-08-01', 50), payout('2026-11-01', 60)]
            });
            const priced = yield* summarize(world('2026-11-13'));
            const sparse = yield* summarize(world('2026-08-05'));

            expect(priced.annualYield.rate).toBeCloseTo((60 / 10000) * (365 / 92), 6);
            expect(sparse.annualYield).toMatchObject({ rate: null, reason: YieldUnavailableReasonEnum.NOT_ENOUGH_PRICES });
        })
    );

    it.effect('averages a refunded position over its whole window, including the empty gap', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({
                positions: [position()],
                movements: [
                    movement(ETH_ACCOUNT_ID, '2025-01-01', 10),
                    movement(ETH_ACCOUNT_ID, '2025-12-01', -10),
                    movement(ETH_ACCOUNT_ID, '2026-06-01', 10),
                    movement(ETH_ACCOUNT_ID, '2026-09-01', 0.2)
                ],
                facts: [valued('2026-09-01', 0.2, 400)]
            });

            expect(summary.annualYield.rate).toBeCloseTo(0.2 / ((17 * 10 + 92 * 10 + 74 * 10.2) / 365), 6);
        })
    );

    it.effect('stops a closed position at its last held day', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({
                positions: [position()],
                movements: [
                    movement(ETH_ACCOUNT_ID, '2025-01-01', 10),
                    movement(ETH_ACCOUNT_ID, '2026-01-15', 0.1),
                    movement(ETH_ACCOUNT_ID, '2026-03-01', -10.1)
                ],
                facts: [valued('2026-01-15', 0.1, 200)]
            });
            const averageUnits = (62 * 10 + 45 * 10.1) / 107;

            expect(summary.annualYield.rate).toBeCloseTo((0.1 / averageUnits) * (365 / 107), 6);
        })
    );

    it.effect('marks the combined yield estimated when estimated rewards reach 5%', () =>
        Effect.gen(function* () {
            const solToUsdt = { ...toUsdt, positionAccountId: SOL_ACCOUNT_ID };
            const summary = yield* summarize(
                mergeWorlds(ethHolding, { prices: ethPrices(2000) }, solHolding(100), {
                    facts: [valued('2026-03-01', 400, 400, toUsdt), valued('2026-03-02', 300, 300, { ...solToUsdt, isEstimated: true })]
                })
            );

            expect(summary.annualYield.isEstimated).toBe(true);
        })
    );
});
