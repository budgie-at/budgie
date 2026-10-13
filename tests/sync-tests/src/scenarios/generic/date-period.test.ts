import { getDateFilterByPeriod } from '@app/@generic/utils/date/get-date-filter-by-period.util';
import { getPeriodByDateRange } from '@app/@generic/utils/date/get-period-by-date-range.util';
import { DatePeriodEnum } from '@budgie/contracts';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';

const at = (iso: string) => new Date(iso);

const NOW_CASES = [
    at('2026-10-14T13:30:00.000'),
    at('2026-10-11T09:00:00.000'),
    at('2026-01-01T00:00:00.000'),
    at('2026-12-31T23:59:00.000')
];

const expectedRanges = (from: Date, to: Date) => ({ from, to });

describe('generic/date-period', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it.each(NOW_CASES)('round-trips every period at %s', now => {
        vi.useFakeTimers();
        vi.setSystemTime(now);

        for (const period of Object.values(DatePeriodEnum)) {
            expect(getPeriodByDateRange(getDateFilterByPeriod(period))).toBe(period);
        }
    });

    it('builds Monday-based week and calendar month/year ranges', () => {
        vi.useFakeTimers();
        vi.setSystemTime(at('2026-10-14T13:30:00.000'));

        expect(getDateFilterByPeriod(DatePeriodEnum.TODAY)).toEqual(
            expectedRanges(at('2026-10-14T00:00:00.000'), at('2026-10-14T23:59:59.999'))
        );
        expect(getDateFilterByPeriod(DatePeriodEnum.THIS_WEEK)).toEqual(
            expectedRanges(at('2026-10-12T00:00:00.000'), at('2026-10-18T23:59:59.999'))
        );
        expect(getDateFilterByPeriod(DatePeriodEnum.LAST_WEEK)).toEqual(
            expectedRanges(at('2026-10-05T00:00:00.000'), at('2026-10-11T23:59:59.999'))
        );
        expect(getDateFilterByPeriod(DatePeriodEnum.THIS_MONTH)).toEqual(
            expectedRanges(at('2026-10-01T00:00:00.000'), at('2026-10-31T23:59:59.999'))
        );
        expect(getDateFilterByPeriod(DatePeriodEnum.LAST_MONTH)).toEqual(
            expectedRanges(at('2026-09-01T00:00:00.000'), at('2026-09-30T23:59:59.999'))
        );
        expect(getDateFilterByPeriod(DatePeriodEnum.THIS_YEAR)).toEqual(
            expectedRanges(at('2026-01-01T00:00:00.000'), at('2026-12-31T23:59:59.999'))
        );
        expect(getDateFilterByPeriod(DatePeriodEnum.ALL_TIME)).toEqual({ from: null, to: null });
    });

    it('returns null for ranges matching no period and ALL_TIME for empty ones', () => {
        expect(getPeriodByDateRange(null)).toBe(DatePeriodEnum.ALL_TIME);
        expect(getPeriodByDateRange({ from: null, to: null })).toBe(DatePeriodEnum.ALL_TIME);
        expect(getPeriodByDateRange({ from: at('2020-02-01T00:00:00.000'), to: at('2020-02-02T00:00:00.000') })).toBeNull();
    });
});
