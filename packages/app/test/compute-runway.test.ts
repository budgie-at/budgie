import { describe, expect, it } from '@effect/vitest';

import { RUNWAY_MINIMUM_MONTHS } from '../src/runway/constant/runway-minimum-months.constant';
import { aggregateRunwayDrivers } from '../src/runway/utils/aggregate-runway-drivers.util';
import { computeRunway } from '../src/runway/utils/compute-runway.util';
import { fillRunwaySeriesMonths } from '../src/runway/utils/fill-runway-series-months.util';

import type { RunwaySeriesRowInterface } from '@budgie/contracts';

const LIQUID = 6000;

const buildSeries = (months: readonly { readonly income: number; readonly expense: number }[]): RunwaySeriesRowInterface[] =>
    months.map((month, index) => ({ month: `2026-0${index + 1}`, ...month }));

const lumpySeries = buildSeries([
    { income: 1000, expense: 2000 },
    { income: 1000, expense: 2000 },
    { income: 1000, expense: 2000 },
    { income: 4000, expense: 2000 },
    { income: 1000, expense: 3000 },
    { income: 1000, expense: 2000 }
]);

const compute = (series: RunwaySeriesRowInterface[], irregularMonthlyAmounts: readonly number[]) =>
    computeRunway({ series, liquid: LIQUID, irregularMonthlyAmounts, referenceDate: new Date('2026-06-15T00:00:00.000Z') });

describe('computeRunway', () => {
    it('uses means so the average month keeps lumpy income and income minus burn equals net', () => {
        const computation = compute(lumpySeries, []);

        expect(computation.income).toBeCloseTo(1500);
        expect(computation.burn).toBeCloseTo(2166.67, 1);
        expect(computation.net).toBeCloseTo(computation.income - computation.burn);
        expect(computation.runwayMonths).toBeCloseTo(LIQUID / Math.abs(computation.net));
    });

    it('has no runway left when the liquid balance is already below zero', () => {
        const referenceDate = new Date('2026-06-15T00:00:00.000Z');
        const computation = computeRunway({ series: lumpySeries, liquid: -LIQUID, irregularMonthlyAmounts: [], referenceDate });

        expect(computation.runwayMonths).toBe(0);
        expect(computation.runsOutAt).toStrictEqual(referenceDate);
    });

    it('removes irregular costs from the burn and the band series', () => {
        const allIn = compute(lumpySeries, []);
        const typical = compute(
            lumpySeries,
            lumpySeries.map(() => 500)
        );

        expect(typical.burn).toBeCloseTo(allIn.burn - 500);
        expect(typical.net).toBeCloseTo(allIn.net + 500);
        expect(typical.p25Net).toBeCloseTo(allIn.p25Net + 500);
        expect(typical.p75Net).toBeCloseTo(allIn.p75Net + 500);
    });

    it('averages irregular drivers over every series month so typical burn never goes negative', () => {
        const series = buildSeries([
            { income: 1000, expense: 3000 },
            { income: 1000, expense: 0 },
            { income: 1000, expense: 0 },
            { income: 1000, expense: 0 },
            { income: 1000, expense: 0 },
            { income: 1000, expense: 0 }
        ]);
        const breakdown = aggregateRunwayDrivers([{ id: 1, title: 'Laptop', month: '2026-01', amount: 3000 }], series, false);

        expect(breakdown.irregularMonthlyAmounts).toStrictEqual([3000, 0, 0, 0, 0, 0]);
        expect(compute(series, breakdown.irregularMonthlyAmounts).burn).toBeCloseTo(0);
    });

    it('removes each one-off only from the month it happened in so the typical band stays flat', () => {
        const series = buildSeries([
            { income: 1000, expense: 1600 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 }
        ]);
        const breakdown = aggregateRunwayDrivers(
            [
                ...series.map(row => ({ id: 1, title: 'Rent', month: row.month, amount: 1000 })),
                { id: 2, title: 'Repair', month: '2026-01', amount: 600 }
            ],
            series,
            false
        );
        const typical = compute(series, breakdown.irregularMonthlyAmounts);

        expect(typical.net).toBeCloseTo(0);
        expect(typical.p25Net).toBeCloseTo(0);
        expect(typical.p75Net).toBeCloseTo(0);
    });

    it('widens the band to net when the percentiles do not bracket it', () => {
        const computation = compute(
            buildSeries([
                { income: 1000, expense: 1000 },
                { income: 1000, expense: 1000 },
                { income: 1000, expense: 1000 },
                { income: 1000, expense: 1000 },
                { income: 1000, expense: 1000 },
                { income: 7000, expense: 1000 }
            ]),
            []
        );

        expect(computation.net).toBeCloseTo(1000);
        expect(computation.p25Net).toBe(0);
        expect(computation.p75Net).toBeCloseTo(computation.net);
    });

    it('returns an empty computation with fewer than the minimum months', () => {
        const computation = compute(lumpySeries.slice(0, RUNWAY_MINIMUM_MONTHS - 1), [500, 500]);

        expect(computation).toMatchObject({ monthsUsed: RUNWAY_MINIMUM_MONTHS - 1, burn: 0, income: 0, p25Net: 0, p75Net: 0 });
    });
});

describe('fillRunwaySeriesMonths', () => {
    const referenceDate = new Date(2026, 5, 15);

    it('zero-fills empty months from the first tracked month through the last complete month', () => {
        expect(
            fillRunwaySeriesMonths(
                [
                    { month: '2026-02', income: 100, expense: 50 },
                    { month: '2026-04', income: 200, expense: 80 }
                ],
                referenceDate
            )
        ).toStrictEqual([
            { month: '2026-02', income: 100, expense: 50 },
            { month: '2026-03', income: 0, expense: 0 },
            { month: '2026-04', income: 200, expense: 80 },
            { month: '2026-05', income: 0, expense: 0 }
        ]);
    });

    it('crosses year boundaries and never fills months before the first tracked month', () => {
        expect(
            fillRunwaySeriesMonths([{ month: '2025-12', income: 1, expense: 1 }], new Date(2026, 1, 10)).map(row => row.month)
        ).toStrictEqual(['2025-12', '2026-01']);
        expect(fillRunwaySeriesMonths([], referenceDate)).toStrictEqual([]);
    });
});
