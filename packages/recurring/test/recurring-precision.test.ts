import { PRECISION, RecurringSeriesKindEnum, RecurringSeriesUserStateEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { RecurringAlertEnum } from '../src/enum/recurring-alert.enum';
import { projectRecurringMonth } from '../src/series/recurring-projection';
import { detectRecurringSeries } from '../src/series/recurring-series';
import { sumRecurringEntriesByKind } from '../src/utils/sum-recurring-entries-by-kind.util';

import type { RecurringChargeInterface } from '../src/interface/recurring-charge.interface';

const charge = (day: number, title = 'NETFLIX', nativeAmount = 12, kind = RecurringSeriesKindEnum.EXPENSE): RecurringChargeInterface => ({
    transactionId: day,
    operatedAt: new Date(2026, 0, day, 12),
    title,
    comment: '',
    defaultAmount: nativeAmount * PRECISION,
    nativeAmount: nativeAmount * PRECISION,
    instrumentId: 1,
    counterpartyIban: null,
    mccCategoryId: null,
    kind,
    accountId: 1,
    categoryId: null,
    categoryTitle: null,
    categoryIcon: null
});

const calendarFromCharges = (charges: readonly RecurringChargeInterface[], now: Date) =>
    projectRecurringMonth(
        detectRecurringSeries(charges).map((item, index) => ({
            ...item,
            seriesId: index + 1,
            userState: RecurringSeriesUserStateEnum.SUGGESTED
        })),
        now.getFullYear(),
        now.getMonth(),
        now
    );

it.effect('keeps income positive and typed and never overdue', () =>
    Effect.sync(() => {
        const series = detectRecurringSeries([5, 36, 64, 95].map(day => charge(day, 'SALARY', 3000, RecurringSeriesKindEnum.INCOME)));
        const data = projectRecurringMonth(
            series.map(item => ({ ...item, seriesId: 1, userState: RecurringSeriesUserStateEnum.SUGGESTED })),
            2026,
            4,
            new Date(2026, 4, 12)
        );
        const entries = [...data.entriesByDay.values(), ...data.forecastedEntriesByDay.values()].flat();
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ kind: RecurringSeriesKindEnum.INCOME, latestAmount: 3000 * PRECISION, isForecast: true });
        expect(entries[0].alert).not.toBe(RecurringAlertEnum.OVERDUE);
        expect(data.forecastedTotalAmount).toBe(0);
    })
);

it.effect('normalizes month-bearing salaries in Ukrainian English and German', () =>
    Effect.sync(() => {
        for (const titles of [
            ['Зарплата СУПЕРМАШ за січень 2026', 'Зарплата СУПЕРМАШ за лютий 2026', 'Зарплата СУПЕРМАШ за березень 2026'],
            ['Salary ACME January 2026', 'Salary ACME February 2026', 'Salary ACME March 2026'],
            ['Gehalt ACME Jänner 2026', 'Gehalt ACME Februar 2026', 'Gehalt ACME März 2026']
        ]) {
            expect(
                detectRecurringSeries([5, 36, 64].map((day, index) => charge(day, titles[index], 1000, RecurringSeriesKindEnum.INCOME)))
            ).toHaveLength(1);
        }
    })
);

it.effect('never finds recurring subsets inside irregular shopping histories', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([1, 7, 35, 37, 66, 87, 96].map(day => charge(day, 'SPAR')))).toEqual([]);
    })
);

it.effect('a single amount clustering keeps a transit subscription and rejects incidental tickets', () =>
    Effect.sync(() => {
        const series = detectRecurringSeries([
            ...[5, 36, 64, 95].map(day => charge(day, 'WIENER LINIEN', 83.4)),
            ...[7, 13, 47, 68, 72, 103].map(day => charge(day, 'WIENER LINIEN', 2.4))
        ]);
        expect(series).toHaveLength(1);
        expect(series[0].predictedAmount).toBe(83.4 * PRECISION);
    })
);

it.effect('two annual occurrences qualify only when one year apart', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 370].map(day => charge(day, 'ANNUAL INSURANCE', 80)))).toHaveLength(1);
        expect(detectRecurringSeries([5, 340].map(day => charge(day, 'ANNUAL INSURANCE', 80)))).toEqual([]);
    })
);

it.effect('native stable streams survive changes in converted FX value', () =>
    Effect.sync(() => {
        const series = detectRecurringSeries(
            [5, 36, 64, 95].map((day, index) => ({ ...charge(day), defaultAmount: (10 + index * 5) * PRECISION }))
        );
        expect(series).toHaveLength(1);
        expect(series[0].events).toHaveLength(4);
    })
);

it.effect('rejects ambiguous charges at the same merchant without a clean amount separation', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 7, 36, 38, 64, 66, 95, 97].map(day => charge(day, 'APPLE', 10)))).toEqual([]);
    })
);

it.effect('allows one missed aligned monthly occurrence but rejects repeated gaps', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 36, 95, 125].map(day => charge(day)))).toHaveLength(1);
        expect(detectRecurringSeries([5, 64, 125, 187].map(day => charge(day)))).toEqual([]);
    })
);

it.effect('does not count overdue expense forecasts in the monthly headline', () =>
    Effect.sync(() => {
        const series = detectRecurringSeries([5, 36, 64, 95].map(day => charge(day)));
        const data = projectRecurringMonth(
            series.map(item => ({ ...item, seriesId: 1, userState: RecurringSeriesUserStateEnum.SUGGESTED })),
            2026,
            4,
            new Date(2026, 4, 12)
        );
        expect(data.forecastedEntriesByDay.get(5)?.[0].alert).toBe(RecurringAlertEnum.OVERDUE);
        expect(data.forecastedTotalAmount).toBe(0);
    })
);

it.effect('does not mine annual shopping pairs out of a frequent merchant amount history', () =>
    Effect.sync(() => {
        expect(
            detectRecurringSeries([
                ...[1, 8, 18, 39, 63, 100, 140, 176, 243, 300].map((day, index) => charge(day, 'SPAR', 4 + index * 3)),
                charge(40, 'SPAR', 75),
                charge(410, 'SPAR', 80)
            ])
        ).toEqual([]);
    })
);

it.effect('never searches many price bands for recurring subsets', () =>
    Effect.sync(() => {
        expect(
            detectRecurringSeries([
                ...[5, 36, 64].map(day => charge(day, 'APPLE', 10)),
                ...[9, 27, 49, 70, 88, 102].map((day, index) => charge(day, 'APPLE', 1 + index * 11))
            ])
        ).toEqual([]);
    })
);

it.effect('weak annual evidence fails closed on off-cycle activity in another native currency', () =>
    Effect.sync(() => {
        expect(
            detectRecurringSeries([
                charge(5, 'SAME COUNTERPARTY', 80),
                charge(370, 'SAME COUNTERPARTY', 80),
                { ...charge(450, 'SAME COUNTERPARTY', 100), instrumentId: 2 }
            ])
        ).toEqual([]);
    })
);

it.effect('a single extra aligned occurrence does not hide an otherwise mature cadence', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 36, 37, 64, 95].map(day => charge(day)))).toHaveLength(1);
    })
);

it.effect('fixed same-day multiplicity must remain consistent across recent cycles', () =>
    Effect.sync(() => {
        expect(detectRecurringSeries([5, 5, 36, 36, 64, 95, 95].map(day => charge(day)))).toEqual([]);
    })
);

it.effect('IBAN identity joins only the same counterparty across descriptive variants', () =>
    Effect.sync(() => {
        const charges = [5, 36, 64].map((day, index) => ({
            ...charge(day, ['FIRST LABEL', 'SECOND LABEL', 'THIRD LABEL'][index]),
            counterpartyIban: 'AT12 3456 7890'
        }));
        expect(detectRecurringSeries(charges)).toHaveLength(1);
        expect(detectRecurringSeries(charges.map((item, index) => ({ ...item, counterpartyIban: `AT${index}1234567890` })))).toEqual([]);
    })
);

it.effect('does not collide identical descriptions across currencies kinds or merchant categories', () =>
    Effect.sync(() => {
        const charges = [5, 36, 64].map(day => charge(day));
        expect(
            detectRecurringSeries([
                ...charges,
                ...charges.map(item => ({ ...item, instrumentId: 2 })),
                ...charges.map(item => ({ ...item, kind: RecurringSeriesKindEnum.INCOME })),
                ...charges.map(item => ({ ...item, mccCategoryId: 12 }))
            ])
        ).toHaveLength(4);
    })
);

it.effect('a proven monthly stream accepts a small price update without predicting the old price', () =>
    Effect.sync(() => {
        const [series] = detectRecurringSeries([
            charge(5, 'FARE', 33),
            charge(36, 'FARE', 33),
            charge(64, 'FARE', 33),
            charge(95, 'FARE', 35)
        ]);
        expect(series.predictedAmount).toBe(35 * PRECISION);
        expect(series.priceChangedAt).toBe(series.events[3].timestamp);
    })
);

it.effect('separates same-day expense and income totals without subtracting either', () =>
    Effect.sync(() => {
        const data = calendarFromCharges(
            [5, 36, 64, 95].flatMap(day => [charge(day, 'TRANSIT', 83.4), charge(day, 'SALARY', 677.43, RecurringSeriesKindEnum.INCOME)]),
            new Date(2026, 4, 5, 12)
        );
        const entries = data.forecastedEntriesByDay.get(5) ?? [];
        expect(sumRecurringEntriesByKind(entries, RecurringSeriesKindEnum.EXPENSE)).toBe(83.4 * PRECISION);
        expect(sumRecurringEntriesByKind(entries, RecurringSeriesKindEnum.INCOME)).toBe(677.43 * PRECISION);
        expect(data.forecastedTotalAmount).toBe(83.4);
    })
);

it.effect('counts a due-today forecast and excludes yesterday even during the overdue grace', () =>
    Effect.sync(() => {
        const charges = [5, 36, 64, 95].map(day => charge(day));
        const today = calendarFromCharges(charges, new Date(2026, 4, 5, 12));
        const yesterday = calendarFromCharges(charges, new Date(2026, 4, 6, 12));
        expect(today.forecastedTotalAmount).toBe(12);
        expect(yesterday.forecastedTotalAmount).toBe(0);
        expect(yesterday.forecastedEntriesByDay.get(5)?.[0].alert).toBeNull();
    })
);

it.effect('drops stale streams from future forecasts and both monthly commitments', () =>
    Effect.sync(() => {
        const data = calendarFromCharges(
            [5, 36, 64, 95].flatMap(day => [charge(day), charge(day, 'SALARY', 100, RecurringSeriesKindEnum.INCOME)]),
            new Date(2026, 4, 25)
        );
        expect(data.forecastedEntriesByDay.size).toBe(0);
        expect(data.committedMonthlyExpense).toBe(0);
        expect(data.committedMonthlyIncome).toBe(0);
    })
);
