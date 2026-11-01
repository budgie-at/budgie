import { describe, expect, it } from '@effect/vitest';

import { selectBudgetWidgetChips } from '../src/budget/utils/select-budget-widget-chips.util';

const limit = (categoryId: number, limitAmount: number) => ({ categoryId, limitAmount, carriedAmount: 0 });
const LIMITS = [limit(1, 2190), limit(2, 670), limit(3, 180), limit(4, 120)];
const SPENT = new Map([
    [1, 1621],
    [2, 575],
    [3, 109],
    [4, 101]
]);

describe('selectBudgetWidgetChips', () => {
    it('shows the two most at-risk categories and counts the rest', () => {
        const selection = selectBudgetWidgetChips(LIMITS, SPENT, 2);

        expect(selection.visible.map(entry => entry.categoryId)).toEqual([2, 4]);
        expect(selection.hiddenCount).toBe(2);
    });

    it('keeps the original order for untouched categories and shrinks at large text sizes', () => {
        const selection = selectBudgetWidgetChips(LIMITS, new Map([[3, 18]]), 1);

        expect(selection.visible.map(entry => entry.categoryId)).toEqual([3]);
        expect(selection.hiddenCount).toBe(3);
        expect(selectBudgetWidgetChips(LIMITS, new Map(), 2).visible.map(entry => entry.categoryId)).toEqual([1, 2]);
    });
});
