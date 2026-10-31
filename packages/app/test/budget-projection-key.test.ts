import { BudgetKindEnum, BudgetLimitSourceEnum, BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fromBudgetProjectionKey } from '../src/budget/utils/from-budget-projection-key.util';
import { toBudgetProjectionKey } from '../src/budget/utils/to-budget-projection-key.util';

import type { BudgetProjectionSourceInterface } from '../src/budget/interface/budget-projection-source.interface';

const BUDGET: BudgetProjectionSourceInterface = {
    id: 3,
    kind: BudgetKindEnum.MAIN,
    period: BudgetPeriodEnum.BIWEEKLY,
    periodStartDay: 1,
    useLastDayOfMonth: false,
    periodAnchorDate: new Date(2026, 9, 5),
    startsAt: null,
    endsAt: null,
    limitSource: BudgetLimitSourceEnum.INCOME_RECEIVED,
    instrumentId: 2,
    overallLimit: 100,
    otherLimit: 10,
    tagId: null
};

it.effect('round-trips dates through epoch milliseconds', () =>
    Effect.sync(() => {
        const key = toBudgetProjectionKey(BUDGET, 1_700_000_000_000);

        expect(key.periodAnchorMs).toBe(new Date(2026, 9, 5).getTime());
        expect(key.startsAtMs).toBeNull();
        expect(fromBudgetProjectionKey(key)).toEqual(BUDGET);
    })
);

it.effect('produces structurally equal keys for equal budgets so the atom family reuses the node', () =>
    Effect.sync(() => {
        expect(toBudgetProjectionKey(BUDGET, 5)).toEqual(toBudgetProjectionKey({ ...BUDGET, periodAnchorDate: new Date(2026, 9, 5) }, 5));
    })
);
