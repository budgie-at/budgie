import { BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { defaultPeriodAnchorDate } from '../src/period/utils/default-period-anchor-date.util';

const THURSDAY = new Date(2026, 9, 29, 15, 30);

it.effect('anchors weekly and biweekly budgets on the Monday of the creation week', () =>
    Effect.sync(() => {
        expect(defaultPeriodAnchorDate(BudgetPeriodEnum.WEEKLY, THURSDAY)).toEqual(new Date(2026, 9, 26));
        expect(defaultPeriodAnchorDate(BudgetPeriodEnum.BIWEEKLY, THURSDAY)).toEqual(new Date(2026, 9, 26));
    })
);

it.effect('anchors yearly budgets on the creation day', () =>
    Effect.sync(() => {
        expect(defaultPeriodAnchorDate(BudgetPeriodEnum.YEARLY, THURSDAY)).toEqual(new Date(2026, 9, 29));
    })
);

it.effect('needs no anchor for monthly budgets', () =>
    Effect.sync(() => {
        expect(defaultPeriodAnchorDate(BudgetPeriodEnum.MONTHLY, THURSDAY)).toBeNull();
    })
);
