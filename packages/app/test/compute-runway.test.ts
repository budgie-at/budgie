import { describe, expect, it } from '@effect/vitest';

import { RUNWAY_MINIMUM_MONTHS } from '../src/runway/constant/runway-minimum-months.constant';
import { aggregateRunwayDrivers } from '../src/runway/utils/aggregate-runway-drivers.util';
import { buildRunwayForecastPath } from '../src/runway/utils/build-forecast-path.util';
import { computeRunway } from '../src/runway/utils/compute-runway.util';
import { fillRunwaySeriesMonths } from '../src/runway/utils/fill-runway-series-months.util';
import { spikeExcess } from '../src/runway/utils/spike-excess.util';

import type { RunwayComputationInterface } from '../src/runway/interface/runway-computation.interface';
import type { RunwayDriverSeriesRowInterface, RunwaySeriesRowInterface } from '@budgie/contracts';

const LIQUID = 6000;
const REFERENCE_DATE = new Date('2026-07-15T00:00:00.000Z');

const buildSeries = (months: readonly { readonly income: number; readonly expense: number }[]): RunwaySeriesRowInterface[] =>
    months.map((month, index) => ({ month: `2026-0${index + 1}`, ...month }));

const buildDriverRows = (id: number, title: string, amounts: readonly number[]): RunwayDriverSeriesRowInterface[] =>
    amounts.map((amount, index) => ({ id, title, month: `2026-0${index + 1}`, amount }));

const sumByMonth = (rows: readonly RunwayDriverSeriesRowInterface[], monthCount: number): number[] =>
    Array.from({ length: monthCount }, (_, index) =>
        rows.filter(row => row.month === `2026-0${index + 1}`).reduce((total, row) => total + row.amount, 0)
    );

const compute = (series: RunwaySeriesRowInterface[], irregularMonthlyAmounts: readonly number[], isAllIn: boolean) =>
    computeRunway({ series, liquid: LIQUID, irregularMonthlyAmounts, isAllIn, referenceDate: REFERENCE_DATE });

const lumpySeries = buildSeries([
    { income: 1000, expense: 2000 },
    { income: 1000, expense: 2000 },
    { income: 1000, expense: 2000 },
    { income: 4000, expense: 2000 },
    { income: 1000, expense: 3000 },
    { income: 1000, expense: 2000 }
]);

const householdDriverRows = [
    ...buildDriverRows(1, 'Rent', [2621, 1799, 2621, 2621, 2621, 2621]),
    ...buildDriverRows(2, 'Uncategorized', [654, 3023, 2749, 909, 1689, 1320]),
    ...buildDriverRows(3, 'Household', [391, 1671, 462, 849, 515, 600]),
    ...buildDriverRows(4, 'Utilities', [45, 377, 535, 0, 377, 300]),
    ...buildDriverRows(5, 'Beauty', [400, 0, 500, 0, 500, 0]),
    ...buildDriverRows(6, 'Car paint', [0, 0, 0, 0, 900, 0]),
    ...buildDriverRows(7, 'Kitchen', [0, 0, 0, 62, 1637, 0])
];
const householdExpenses = sumByMonth(householdDriverRows, 6);
const householdSeries = buildSeries(householdExpenses.map(expense => ({ income: 5200, expense })));

describe('spikeExcess', () => {
    it('treats a single purchase as entirely one-off', () => {
        expect(spikeExcess([0, 0, 0, 0, 900, 0])).toStrictEqual([0, 0, 0, 0, 900, 0]);
    });

    it('keeps steady, every-other-month and noisy recurring spending', () => {
        expect(spikeExcess([2621, 1799, 2621, 2621, 2621, 2621])).toStrictEqual([0, 0, 0, 0, 0, 0]);
        expect(spikeExcess([400, 0, 500, 0, 500, 0])).toStrictEqual([0, 0, 0, 0, 0, 0]);
        expect(spikeExcess([654, 3023, 2749, 909, 1689, 1320])).toStrictEqual([0, 0, 0, 0, 0, 0]);
    });

    it('does not cut a bill paid two months at once', () => {
        expect(spikeExcess([1000, 0, 2000, 1000, 1000, 1000])).toStrictEqual([0, 0, 0, 0, 0, 0]);
    });

    it('removes only the part of a month above the robust fence', () => {
        const excess = spikeExcess([100, 100, 100, 100, 1000, 100]);

        expect(excess.slice(0, 4)).toStrictEqual([0, 0, 0, 0]);
        expect(excess[4]).toBeCloseTo(600);
    });

    it('returns no excess for an empty series', () => {
        expect(spikeExcess([])).toStrictEqual([]);
    });
});

describe('aggregateRunwayDrivers', () => {
    it('keeps volatile recurring categories in the typical burn and only drops real one-offs', () => {
        const breakdown = aggregateRunwayDrivers(householdDriverRows, householdSeries, false);
        const oneOffTotal = breakdown.irregularMonthlyAmounts.reduce((total, amount) => total + amount, 0);
        const titles = breakdown.drivers.map(driver => driver.title);

        expect(oneOffTotal).toBeCloseTo(900 + 1637 + 62);
        expect(titles).toEqual(expect.arrayContaining(['Rent', 'Uncategorized', 'Household', 'Utilities', 'Beauty']));
        expect(titles).not.toContain('Kitchen');
        expect(breakdown.drivers.every(driver => !driver.isIrregular)).toBe(true);
    });

    it('lists every driver at its averaged amount and flags mostly one-off drivers in all-in mode', () => {
        const breakdown = aggregateRunwayDrivers(householdDriverRows, householdSeries, true);
        const kitchen = breakdown.drivers.find(driver => driver.title === 'Kitchen');
        const rent = breakdown.drivers.find(driver => driver.title === 'Rent');

        expect(kitchen?.monthlyAmount).toBeCloseTo((62 + 1637) / 6);
        expect(kitchen?.isIrregular).toBe(true);
        expect(rent?.isIrregular).toBe(false);
    });

    it('subtracts only the spike from a driver that also has a regular baseline', () => {
        const series = buildSeries(Array.from({ length: 6 }, () => ({ income: 2000, expense: 1000 })));
        const breakdown = aggregateRunwayDrivers(buildDriverRows(1, 'Groceries', [100, 100, 100, 100, 1000, 100]), series, false);

        expect(breakdown.irregularMonthlyAmounts[4]).toBeCloseTo(600);
        expect(breakdown.drivers[0]?.monthlyAmount).toBeCloseTo(150);
    });

    it('folds drivers below the minimum burn share into one row', () => {
        const series = buildSeries(Array.from({ length: 3 }, () => ({ income: 0, expense: 1010 })));
        const breakdown = aggregateRunwayDrivers(
            [...buildDriverRows(1, 'Rent', [1000, 1000, 1000]), ...buildDriverRows(2, 'Gum', [10, 10, 10])],
            series,
            true
        );

        expect(breakdown.drivers).toHaveLength(2);
        expect(breakdown.drivers[1]).toMatchObject({ id: null, monthlyAmount: 10, foldedDriverCount: 1 });
    });
});

describe('computeRunway', () => {
    it('averages every month in all-in mode so income minus burn equals net', () => {
        const computation = compute(lumpySeries, [], true);

        expect(computation.income).toBeCloseTo(1500);
        expect(computation.burn).toBeCloseTo(2166.67, 1);
        expect(computation.net).toBeCloseTo(computation.income - computation.burn);
        expect(computation.runwayMonths).toBeCloseTo(LIQUID / Math.abs(computation.net));
    });

    it('reports a deficit when volatile recurring spending exceeds income', () => {
        const typical = compute(
            householdSeries,
            aggregateRunwayDrivers(householdDriverRows, householdSeries, false).irregularMonthlyAmounts,
            false
        );
        const allIn = compute(householdSeries, [], true);

        expect(typical.burn).toBeCloseTo(allIn.burn - (900 + 1637 + 62) / 6);
        expect(typical.isPositive).toBe(false);
        expect(allIn.isPositive).toBe(false);
        expect(allIn.runwayMonths).toBeLessThan(typical.runwayMonths ?? 0);
    });

    it('ignores one-off amounts in all-in mode', () => {
        expect(
            compute(
                lumpySeries,
                lumpySeries.map(() => 500),
                true
            ).burn
        ).toBeCloseTo(compute(lumpySeries, [], true).burn);
    });

    it('caps a one-off income windfall at the robust fence like it caps one-off costs', () => {
        const series = buildSeries([
            { income: 1000, expense: 1600 },
            { income: 1000, expense: 1600 },
            { income: 1000, expense: 1600 },
            { income: 1000, expense: 1600 },
            { income: 9000, expense: 1600 },
            { income: 1000, expense: 1600 }
        ]);
        const typical = compute(series, [], false);
        const allIn = compute(series, [], true);

        expect(typical.income).toBeCloseTo((5000 + 4000) / 6);
        expect(typical.isPositive).toBe(false);
        expect(allIn.income).toBeCloseTo(2333.33, 1);
        expect(allIn.isPositive).toBe(true);
    });

    it('removes each one-off only from the month it happened in so a steady month has no spread', () => {
        const series = buildSeries([
            { income: 1000, expense: 1600 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 },
            { income: 1000, expense: 1000 }
        ]);
        const breakdown = aggregateRunwayDrivers(
            [...buildDriverRows(1, 'Rent', [1000, 1000, 1000, 1000, 1000, 1000]), ...buildDriverRows(2, 'Repair', [600, 0, 0, 0, 0, 0])],
            series,
            false
        );
        const typical = compute(series, breakdown.irregularMonthlyAmounts, false);

        expect(typical.net).toBeCloseTo(0);
        expect(typical.netStandardDeviation).toBeCloseTo(0);
    });

    it('measures the month-to-month spread of net as a sample standard deviation', () => {
        const computation = compute(
            buildSeries([
                { income: 1000, expense: 900 },
                { income: 1000, expense: 1100 },
                { income: 1000, expense: 900 },
                { income: 1000, expense: 1100 }
            ]),
            [],
            true
        );

        expect(computation.net).toBeCloseTo(0);
        expect(computation.netStandardDeviation).toBeCloseTo(Math.sqrt(40_000 / 3));
    });

    it('has no runway left when the liquid balance is already below zero', () => {
        const computation = computeRunway({
            series: lumpySeries,
            liquid: -LIQUID,
            irregularMonthlyAmounts: [],
            isAllIn: true,
            referenceDate: REFERENCE_DATE
        });

        expect(computation.runwayMonths).toBe(0);
        expect(computation.runsOutAt).toStrictEqual(REFERENCE_DATE);
    });

    it('returns an empty computation with fewer than the minimum months', () => {
        const computation = compute(lumpySeries.slice(0, RUNWAY_MINIMUM_MONTHS - 1), [500, 500], false);

        expect(computation).toMatchObject({
            monthsUsed: RUNWAY_MINIMUM_MONTHS - 1,
            burn: 0,
            income: 0,
            netStandardDeviation: 0,
            isPositive: true
        });
    });
});

describe('buildRunwayForecastPath', () => {
    const baseComputation: RunwayComputationInterface = {
        burn: 10_000,
        income: 15_000,
        net: 5000,
        liquid: 14_500,
        runwayMonths: null,
        runsOutAt: null,
        netStandardDeviation: 0,
        monthsUsed: 6,
        isPositive: true
    };
    const build = (computation: RunwayComputationInterface) =>
        buildRunwayForecastPath({
            computation,
            width: 300,
            height: 152,
            paddingLeft: 0,
            paddingRight: 1,
            paddingTop: 22,
            paddingBottom: 36
        });

    it('draws the starting balance label above the line, clear of the zero label', () => {
        const geometry = build(baseComputation);

        expect(geometry.startLabelY).toBeLessThan(geometry.zeroY - 3 - 11);
        expect(geometry.isZeroLabelVisible).toBe(true);
        expect(geometry.endValue).toBe(14_500 + 5000 * 12);
    });

    it('hides the zero label when the starting balance sits on the zero line', () => {
        expect(build({ ...baseComputation, liquid: 500 }).isZeroLabelVisible).toBe(false);
    });

    it('collapses the band onto the line when every month nets the same', () => {
        const geometry = build(baseComputation);

        expect(geometry.bandPath.startsWith(geometry.likelyPath)).toBe(true);
    });

    it('widens the band with the square root of time instead of linearly', () => {
        const pointY = (path: string, index: number) => Number(path.split(' ')[index]?.split(',')[1]);
        const geometry = build({ ...baseComputation, net: 0, liquid: 10_000, netStandardDeviation: 1000 });
        const spreadAtThreeMonths = pointY(geometry.likelyPath, 1) - pointY(geometry.bandPath, 1);
        const spreadAtTwelveMonths = pointY(geometry.likelyPath, 4) - pointY(geometry.bandPath, 4);

        expect(spreadAtTwelveMonths / spreadAtThreeMonths).toBeCloseTo(Math.sqrt(12 + 144 / 6) / Math.sqrt(3 + 9 / 6));
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
