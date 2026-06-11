import { budgetPeriodService } from '@budgie/budget';

const YEAR_2026 = 2026;

describe('budgetPeriodService', () => {
    it('clamps period start day to shorter months and returns the next period start', () => {
        const now = new Date('2026-02-28T12:00:00.000Z');

        const window = budgetPeriodService.computePeriodWindow(31, false, now);

        expect(window.periodStart.getFullYear()).toBe(YEAR_2026);
        expect(window.periodStart.getMonth()).toBe(1);
        expect(window.periodStart.getDate()).toBe(28);
        expect(window.nextPeriodStart.getFullYear()).toBe(YEAR_2026);
        expect(window.nextPeriodStart.getMonth()).toBe(2);
        expect(window.nextPeriodStart.getDate()).toBe(31);
    });

    it('uses the previous month-end before the current month-end boundary', () => {
        const now = new Date('2026-02-27T12:00:00.000Z');

        const window = budgetPeriodService.computePeriodWindow(1, true, now);

        expect(window.periodStart.getFullYear()).toBe(YEAR_2026);
        expect(window.periodStart.getMonth()).toBe(0);
        expect(window.periodStart.getDate()).toBe(31);
        expect(window.nextPeriodStart.getFullYear()).toBe(YEAR_2026);
        expect(window.nextPeriodStart.getMonth()).toBe(1);
        expect(window.nextPeriodStart.getDate()).toBe(28);
    });
});
