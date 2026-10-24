import { describe, expect, it } from '@effect/vitest';

import { RUNWAY_MINIMUM_MONTHS } from '../src/runway/constant/runway-minimum-months.constant';
import { computeRunway } from '../src/runway/utils/compute-runway.util';

import type { RunwaySeriesRowInterface } from '@budgie/contracts';

const REFERENCE_DATE = new Date('2026-06-15T00:00:00.000Z');
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

const compute = (series: RunwaySeriesRowInterface[], isAllIn: boolean, irregularMonthlyAmount: number) =>
    computeRunway({ series, liquid: LIQUID, irregularMonthlyAmount, isAllIn, referenceDate: REFERENCE_DATE });

describe('computeRunway', () => {
    it('uses means so the average month keeps lumpy income and income minus burn equals net', () => {
        const computation = compute(lumpySeries, true, 0);

        expect(computation.income).toBeCloseTo(1500);
        expect(computation.burn).toBeCloseTo(2166.67, 1);
        expect(computation.net).toBeCloseTo(computation.income - computation.burn);
        expect(computation.runwayMonths).toBeCloseTo(LIQUID / Math.abs(computation.net));
        expect(computation.isPositive).toBe(false);
    });

    it('keeps irregular costs in the burn when all-in', () => {
        const computation = compute(lumpySeries, true, 500);

        expect(computation.burn).toBeCloseTo(2166.67, 1);
    });

    it('removes irregular costs from the burn and the band series in typical mode', () => {
        const allIn = compute(lumpySeries, true, 500);
        const typical = compute(lumpySeries, false, 500);

        expect(typical.burn).toBeCloseTo(allIn.burn - 500);
        expect(typical.net).toBeCloseTo(allIn.net + 500);
        expect(typical.p25Net).toBeCloseTo(allIn.p25Net + 500);
        expect(typical.p75Net).toBeCloseTo(allIn.p75Net + 500);
    });

    it('clamps the band around net so the line always lies inside it', () => {
        const computation = compute(lumpySeries, true, 0);

        expect(computation.p25Net).toBeLessThanOrEqual(computation.net);
        expect(computation.p75Net).toBeGreaterThanOrEqual(computation.net);
    });

    it('widens the band to net when the percentiles do not bracket it', () => {
        const skewedSeries = buildSeries([
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 7000, expense: 1000 }
        ]);
        const computation = compute(skewedSeries, true, 0);

        expect(computation.net).toBeCloseTo(1000);
        expect(computation.p25Net).toBe(0);
        expect(computation.p75Net).toBeCloseTo(computation.net);
    });

    it('returns an empty computation with fewer than the minimum months', () => {
        const computation = compute(lumpySeries.slice(0, RUNWAY_MINIMUM_MONTHS - 1), false, 500);

        expect(computation.monthsUsed).toBe(RUNWAY_MINIMUM_MONTHS - 1);
        expect(computation.burn).toBe(0);
        expect(computation.income).toBe(0);
        expect(computation.p25Net).toBeLessThanOrEqual(computation.net);
    });
});
