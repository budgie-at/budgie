import { describe, expect, it } from '@effect/vitest';

import { formatBudgetFundDueDate } from '../src/budget/utils/format-budget-fund-due-date.util';

const short = (date: Date) => `short ${date.getMonth() + 1}/${date.getDate()}`;
const long = (date: Date) => `long ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
const TODAY = new Date(2026, 9, 31);

describe('formatBudgetFundDueDate', () => {
    it('keeps the short form inside the current year', () => {
        expect(formatBudgetFundDueDate(new Date(2026, 11, 3), TODAY, short, long)).toBe('short 12/3');
    });

    it('adds the year for a due date in another year', () => {
        expect(formatBudgetFundDueDate(new Date(2027, 9, 20), TODAY, short, long)).toBe('long 10/20/2027');
    });
});
