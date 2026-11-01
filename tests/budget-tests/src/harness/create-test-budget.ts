import { BudgetService } from '@budgie/budget';
import { BudgetPeriodEnum, PRECISION } from '@budgie/contracts';
import * as Effect from 'effect/Effect';

import type { BudgetCreateInputInterface } from '@budgie/budget';

export const createTestBudget = (overrides: Partial<BudgetCreateInputInterface> = {}) =>
    Effect.flatMap(BudgetService, budgetService =>
        budgetService.createBudget({
            name: 'Test Budget',
            period: BudgetPeriodEnum.MONTHLY,
            periodStartDay: 1,
            useLastDayOfMonth: false,
            overallLimit: 1_000 * PRECISION,
            otherLimit: 0,
            instrumentId: 1,
            categoryLimits: [],
            ...overrides
        })
    );
