import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { BudgetDayStateEnum } from '../src/budget/enum/budget-day-state.enum';
import { buildBudgetDayStripCells } from '../src/budget/utils/build-budget-day-strip-cells.util';

import type { BudgetProjectionDayInterface } from '@budgie/budget';

const dayOf = (index: number, variableSpent: number | null): BudgetProjectionDayInterface => ({
    date: new Date(2026, 0, index + 1),
    actual: variableSpent,
    variableSpent,
    projected: null
});

it.effect('keeps one cell per day for weekly, two-week and monthly budgets', () =>
    Effect.sync(() => {
        const days = [dayOf(0, 10), dayOf(1, 0), dayOf(2, null)];
        const cells = buildBudgetDayStripCells({ days, elapsedDays: 2, dailyAllowance: 10 }, BudgetPeriodEnum.WEEKLY);

        expect(cells.map(cell => cell.dayState)).toEqual([BudgetDayStateEnum.WITHIN, BudgetDayStateEnum.TODAY, BudgetDayStateEnum.FUTURE]);
    })
);

it.effect('groups yearly budgets into week cells with a weekly allowance', () =>
    Effect.sync(() => {
        const days = Array.from({ length: 14 }, (_unused, index) => dayOf(index, index < 7 ? 4 : null));
        const cells = buildBudgetDayStripCells({ days, elapsedDays: 10, dailyAllowance: 5 }, BudgetPeriodEnum.YEARLY);

        expect(cells).toHaveLength(2);
        expect(cells[0].dayState).toBe(BudgetDayStateEnum.WITHIN);
        expect(cells[1].dayState).toBe(BudgetDayStateEnum.TODAY);
    })
);

it.effect('marks a yearly week over its allowance', () =>
    Effect.sync(() => {
        const days = Array.from({ length: 14 }, (_unused, index) => dayOf(index, index < 7 ? 7 : null));
        const [firstWeek] = buildBudgetDayStripCells({ days, elapsedDays: 14, dailyAllowance: 5 }, BudgetPeriodEnum.YEARLY);

        expect(firstWeek.dayState).toBe(BudgetDayStateEnum.OVER);
    })
);
