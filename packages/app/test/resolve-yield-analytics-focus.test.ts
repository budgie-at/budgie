import { YieldRangeEnum } from '@budgie/market';
import { expect, it } from '@effect/vitest';

import { resolveYieldAnalyticsFocus } from '../src/yield/utils/resolve-yield-analytics-focus.util';

const TODAY = new Date(2026, 10, 13, 12);
const range = (from: Date, to: Date) => ({ from, to });

it.each([
    ['this calendar month', range(new Date(2026, 10, 1), new Date(2026, 10, 30, 23, 59, 59)), YieldRangeEnum.YEAR, '2026-11-01'],
    ['a month 12 months back', range(new Date(2025, 10, 1), new Date(2025, 10, 30, 23, 59, 59)), YieldRangeEnum.YEAR, '2025-11-01'],
    ['a month 13 months back', range(new Date(2025, 9, 1), new Date(2025, 9, 31, 23, 59, 59)), YieldRangeEnum.YEAR, null],
    ['this Monday week', range(new Date(2026, 10, 9), new Date(2026, 10, 15, 23, 59, 59)), YieldRangeEnum.QUARTER, '2026-11-09'],
    ['a week 12 weeks back', range(new Date(2026, 7, 17), new Date(2026, 7, 23, 23, 59, 59)), YieldRangeEnum.QUARTER, '2026-08-17'],
    ['a week 13 weeks back', range(new Date(2026, 7, 10), new Date(2026, 7, 16, 23, 59, 59)), YieldRangeEnum.YEAR, null],
    ['today', range(new Date(2026, 10, 13), new Date(2026, 10, 13, 23, 59, 59)), YieldRangeEnum.MONTH, '2026-11-13'],
    ['a day 29 days back', range(new Date(2026, 9, 15), new Date(2026, 9, 15, 23, 59, 59)), YieldRangeEnum.MONTH, '2026-10-15'],
    ['a day 30 days back', range(new Date(2026, 9, 14), new Date(2026, 9, 14, 23, 59, 59)), YieldRangeEnum.YEAR, null],
    ['a custom span', range(new Date(2026, 9, 3), new Date(2026, 9, 20, 23, 59, 59)), YieldRangeEnum.YEAR, null]
])('maps %s', (_, date, expectedRange, focusDay) => {
    expect(resolveYieldAnalyticsFocus(date, TODAY)).toEqual({ range: expectedRange, focusDay });
});

it('maps all time to 1Y unfocused', () => {
    expect(resolveYieldAnalyticsFocus(null, TODAY)).toEqual({ range: YieldRangeEnum.YEAR, focusDay: null });
});
