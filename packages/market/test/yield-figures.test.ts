import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { YieldPositionSectionEnum } from '../src/yield/enum/yield-position-section.enum';

import {
    BASE_ID,
    DEPOSIT_ACCOUNT_ID,
    ETH_ACCOUNT_ID,
    ETH_ID,
    ETH_RATE,
    LUMPY_RATE,
    SOL_ACCOUNT_ID,
    SOL_ID,
    at,
    priceRange,
    deposit,
    ethStakingWorld,
    interest,
    latestRate,
    lumpyDepositWorld,
    mergeWorlds,
    movement,
    solPosition,
    summarize,
    tax,
    valued
} from './yield-test-kit';

const solReward = {
    positionAccountId: SOL_ACCOUNT_ID,
    landingAccountId: SOL_ACCOUNT_ID,
    landingInstrumentId: SOL_ID,
    landingInstrumentCode: 'SOL'
};
const ratedDeposit = (deadline: string | null) => ({
    positions: [deposit({ interestRate: 12, deadline: deadline === null ? null : at(deadline) })],
    movements: [movement(DEPOSIT_ACCOUNT_ID, '2026-05-01', 1000)]
});

describe('YieldService figures', () => {
    it.effect('accrues a rated deposit with no interest yet, capped at its deadline, never in Earned', () =>
        Effect.gen(function* () {
            const open = yield* summarize(ratedDeposit('2027-03-03'));
            const matured = yield* summarize(ratedDeposit('2026-09-01'));

            expect(open.positions.at(0)?.accruing).toBeCloseTo((1000 * 0.12 * 196) / 365, 6);
            expect(matured.positions.at(0)?.accruing).toBeCloseTo((1000 * 0.12 * 123) / 365, 6);
            expect([open.earned.value, open.hasYield]).toEqual([0, false]);
        })
    );

    it.effect('runs at position yield × current value, with the rate fallback, excluding "—" positions', () =>
        Effect.gen(function* () {
            const youngSol = {
                positions: [solPosition],
                movements: [movement(SOL_ACCOUNT_ID, '2026-11-01', 50)],
                facts: [valued('2026-11-05', 1, 100, solReward)],
                latestRates: [latestRate(SOL_ID, BASE_ID, 100)]
            };
            const summary = yield* summarize(mergeWorlds(ethStakingWorld, ratedDeposit(null), youngSol));

            expect(summary.runRate?.value).toBeCloseTo(10.4 * 2000 * ETH_RATE + 120, 6);
            expect(summary.runRate?.isEstimated).toBe(false);
        })
    );

    it.effect('shows vs rate per deposit with a payout, and on the summary only when filtered to it', () =>
        Effect.gen(function* () {
            const scoped = yield* summarize(lumpyDepositWorld(10), { positionAccountId: DEPOSIT_ACCOUNT_ID });
            const unscoped = yield* summarize(lumpyDepositWorld(10));

            expect(scoped.vsRate?.expected).toBeCloseTo(0.1, 6);
            expect(scoped.vsRate?.actual).toBeCloseTo(LUMPY_RATE, 6);
            expect(unscoped.vsRate).toBeNull();
            expect(unscoped.positions.at(0)?.vsRate?.expected).toBeCloseTo(0.1, 6);
        })
    );

    it.effect('values crypto rewards today at the latest price, next to their arrival value', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({
                facts: [valued('2026-10-01', 0.1, 150), valued('2026-11-01', 0.2, 280), interest('2026-11-02', 50)],
                latestRates: [latestRate(ETH_ID, BASE_ID, 2000)]
            });

            expect(summary.cryptoRewardsToday?.value).toBeCloseTo(600, 6);
            expect(summary.cryptoRewardsToday?.arrivalValue).toBeCloseTo(430, 6);
        })
    );

    it.effect('splits positions into Active and Closed with their Earned, units and tax', () =>
        Effect.gen(function* () {
            const summary = yield* summarize(
                mergeWorlds(ethStakingWorld, {
                    positions: [deposit({ isActive: false })],
                    facts: [interest('2026-03-01', 5), tax('2026-03-02', 1, DEPOSIT_ACCOUNT_ID)]
                })
            );
            const eth = summary.positions.find(row => row.accountId === ETH_ACCOUNT_ID);
            const closed = summary.positions.find(row => row.accountId === DEPOSIT_ACCOUNT_ID);

            expect(eth).toMatchObject({ section: YieldPositionSectionEnum.ACTIVE, earned: 800, tax: 0 });
            expect(eth?.rewardUnits).toBeCloseTo(0.4, 6);
            expect(closed).toMatchObject({ section: YieldPositionSectionEnum.CLOSED, earned: 5, tax: 1 });
            expect(summary.positions.map(row => row.accountId)).toEqual([ETH_ACCOUNT_ID, DEPOSIT_ACCOUNT_ID]);
        })
    );

    it.effect('names each estimate cause with the price it fell back to', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({
                facts: [valued('2026-03-12', 1, 90, { ...solReward, isEstimated: true })],
                prices: priceRange(SOL_ID, BASE_ID, ['2026-02-01', '2026-03-06'], 100)
            });

            expect(summary.estimateCauses).toEqual([{ instrumentCode: 'SOL', day: '2026-03-12', sourceDay: '2026-03-06' }]);
        })
    );
});
