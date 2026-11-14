import { YieldKindEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { YieldBucketUnitEnum } from '../src/yield/enum/yield-bucket-unit.enum';
import { YieldDeltaKindEnum } from '../src/yield/enum/yield-delta-kind.enum';
import { YieldGroupEnum } from '../src/yield/enum/yield-group.enum';
import { YieldRangeEnum } from '../src/yield/enum/yield-range.enum';

import { DEPOSIT_ACCOUNT_ID, earnedBetween, interest, summarize, tax, valued } from './yield-test-kit';

const total = (values: readonly number[] | null) => (values ?? []).reduce((sum, value) => sum + value, 0);

describe('YieldService summary', () => {
    it.effect('counts INCOME as Earned before tax and TAX as a positive tax', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({ facts: [valued('2026-03-10', 2, 100), tax('2026-03-11', 10)] });

            expect([summary.earned, summary.tax, summary.net, summary.payoutCount]).toEqual([
                { value: 100, isEstimated: false },
                10,
                90,
                1
            ]);
        })
    );

    it.effect('builds 30 days, 13 weeks, 13 months, and months, quarters or years for All', () =>
        Effect.gen(function* () {
            const recent = { facts: [valued('2026-03-10', 1, 1)] };
            const month = yield* summarize(recent, { range: YieldRangeEnum.MONTH });
            const quarter = yield* summarize(recent, { range: YieldRangeEnum.QUARTER });
            const year = yield* summarize(recent);
            const allMonths = yield* summarize(recent, { range: YieldRangeEnum.ALL });
            const allQuarters = yield* summarize({ facts: [valued('2022-01-10', 1, 1)] }, { range: YieldRangeEnum.ALL });
            const allYears = yield* summarize({ facts: [valued('2014-01-10', 1, 1)] }, { range: YieldRangeEnum.ALL });
            const summaries = [month, quarter, year, allMonths, allQuarters, allYears];

            expect(summaries.map(summary => summary.buckets.length)).toEqual([30, 13, 13, 9, 20, 13]);
            expect(summaries.map(summary => summary.bucketUnit)).toEqual([
                YieldBucketUnitEnum.DAY,
                YieldBucketUnitEnum.WEEK,
                YieldBucketUnitEnum.MONTH,
                YieldBucketUnitEnum.MONTH,
                YieldBucketUnitEnum.QUARTER,
                YieldBucketUnitEnum.YEAR
            ]);
            expect([month.windowStart, quarter.windowStart, year.windowStart, allMonths.windowStart]).toEqual([
                '2026-10-15',
                '2026-08-17',
                '2025-11-01',
                '2026-03-01'
            ]);
            expect(year.buckets.at(0)).toMatchObject({ start: '2025-11-01', end: '2025-11-30', isInProgress: false });
            expect(year.buckets.at(-1)).toMatchObject({ start: '2026-11-01', end: '2026-11-13', isInProgress: true });
        })
    );

    it.effect('stacks group amounts per bucket with tax as a positive amount', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({
                facts: [valued('2026-03-10', 1, 100), interest('2026-03-20', 10), tax('2026-03-21', 3, DEPOSIT_ACCOUNT_ID)]
            });

            expect(summary.buckets.at(4)).toMatchObject({
                start: '2026-03-01',
                total: 110,
                isEstimated: false,
                amounts: {
                    [YieldGroupEnum.STAKING_EARN]: 100,
                    [YieldGroupEnum.INTEREST]: 10,
                    [YieldGroupEnum.DIVIDENDS]: 0,
                    [YieldGroupEnum.DISTRIBUTIONS]: 0,
                    [YieldGroupEnum.TAX]: 3
                }
            });
        })
    );

    it.effect('compares 1Y Earned with the prior 13 months cut to the same elapsed fraction, with no overlap', () =>
        Effect.gen(function* () {
            const change = yield* summarize({
                facts: [valued('2025-10-05', 1, 50), valued('2025-10-20', 1, 30), valued('2026-03-10', 1, 100)]
            });
            const fresh = yield* summarize({ facts: [valued('2026-03-10', 1, 100)] });
            const dropped = yield* summarize({ facts: [valued('2025-10-05', 1, 50)] });
            const quiet = yield* summarize({ facts: [valued('2023-01-01', 1, 50)] });
            const boundary = yield* summarize({ facts: [valued('2025-10-05', 1, 50), valued('2025-11-01', 1, 20)] });

            expect(change.delta).toEqual({ kind: YieldDeltaKindEnum.CHANGE, ratio: 1 });
            expect(change.priorTotals?.at(-1)).toBe(50);
            expect(fresh.delta).toEqual({ kind: YieldDeltaKindEnum.NEW, ratio: null });
            expect(dropped.earned.value).toBe(0);
            expect(dropped.delta).toEqual({ kind: YieldDeltaKindEnum.CHANGE, ratio: -1 });
            expect(quiet.delta).toBeNull();
            expect([boundary.earned.value, total(boundary.priorTotals)]).toEqual([20, 50]);
        })
    );

    it.effect('shifts 3M by 13 weeks and has no prior path for All', () =>
        Effect.gen(function* () {
            const quarter = yield* summarize(
                { facts: [valued('2026-08-14', 1, 10), valued('2026-08-15', 1, 7), valued('2026-09-01', 1, 20)] },
                { range: YieldRangeEnum.QUARTER }
            );
            const all = yield* summarize({ facts: [valued('2026-03-10', 1, 100)] }, { range: YieldRangeEnum.ALL });

            expect([quarter.earned.value, quarter.delta]).toEqual([20, { kind: YieldDeltaKindEnum.CHANGE, ratio: 1 }]);
            expect([all.delta, all.priorTotals]).toEqual([null, null]);
        })
    );

    it.effect('isolates a group: share of all Earned, and tax only from positions that produced it', () =>
        Effect.gen(function* () {
            const facts = [
                valued('2026-03-10', 1, 30),
                interest('2026-03-20', 10),
                tax('2026-03-21', 3, DEPOSIT_ACCOUNT_ID),
                tax('2026-03-22', 2)
            ];
            const isolated = yield* summarize({ facts }, { group: YieldGroupEnum.INTEREST });
            const all = yield* summarize({ facts });

            expect(isolated).toMatchObject({ earned: { value: 10 }, share: 0.25, tax: 3, net: 7 });
            expect(all).toMatchObject({ earned: { value: 40 }, share: null, tax: 5, net: 35 });
            expect(isolated.groups).toEqual([
                { group: YieldGroupEnum.STAKING_EARN, total: 30 },
                { group: YieldGroupEnum.INTEREST, total: 10 }
            ]);
            expect(isolated.buckets.at(4)?.total).toBe(10);
        })
    );

    it.effect('marks a figure estimated when estimated values reach 5% of it', () =>
        Effect.gen(function* () {
            const estimated = yield* summarize({ facts: [valued('2026-03-10', 1, 95), valued('2026-03-11', 1, 5, { isEstimated: true })] });
            const priced = yield* summarize({ facts: [valued('2026-03-10', 1, 96), valued('2026-03-11', 1, 4, { isEstimated: true })] });

            expect([estimated.earned.isEstimated, priced.earned.isEstimated]).toEqual([true, false]);
            expect(estimated.buckets.at(4)?.isEstimated).toBe(true);
        })
    );

    it.effect('sums Earned between two days for an Analytics period, before tax', () =>
        Effect.gen(function* () {
            const period = yield* earnedBetween(
                {
                    facts: [
                        valued('2026-03-10', 1, 100),
                        valued('2026-03-20', 1, 6, { isEstimated: true }),
                        tax('2026-03-21', 9),
                        valued('2026-04-01', 1, 7)
                    ]
                },
                '2026-03-01',
                '2026-03-31'
            );

            expect(period).toEqual({ value: 106, isEstimated: true });
        })
    );

    it.effect('keeps local midnight boundaries identical to filtering all facts, including the DST day', () =>
        Effect.gen(function* () {
            const facts = [
                { ...valued('2026-03-28', 1, 7), operatedAt: new Date(2026, 2, 28, 23, 59, 59) },
                { ...valued('2026-03-29', 1, 11), operatedAt: new Date(2026, 2, 29) },
                { ...valued('2026-03-29', 1, 13, { isEstimated: true }), operatedAt: new Date(2026, 2, 29, 23, 59, 59) },
                { ...valued('2026-03-30', 1, 17), operatedAt: new Date(2026, 2, 30) },
                tax('2026-03-29', 3)
            ];
            const period = yield* earnedBetween({ facts }, '2026-03-29', '2026-03-29');

            expect(period).toEqual({ value: 24, isEstimated: true });
        })
    );

    it.effect('lists the groups present in the scope across all ranges, in stack order, plus first/last payout days', () =>
        Effect.gen(function* () {
            const summary = yield* summarize({
                facts: [
                    valued('2024-02-01', 1, 7, { yieldKind: YieldKindEnum.DIVIDEND }),
                    valued('2026-03-10', 1, 100),
                    valued('2026-04-01', 1, 1, { positionAccountId: null })
                ]
            });

            expect(summary.groups).toEqual([
                { group: YieldGroupEnum.STAKING_EARN, total: 101 },
                { group: YieldGroupEnum.DIVIDENDS, total: 0 }
            ]);
            expect(summary).toMatchObject({
                hasYield: true,
                hasUnassigned: true,
                firstYieldDay: '2024-02-01',
                lastPayoutDay: '2026-04-01'
            });
        })
    );
});
