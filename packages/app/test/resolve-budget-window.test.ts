import { BudgetKindEnum, BudgetPeriodEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { resolveBudgetWindow } from '../src/budget/utils/resolve-budget-window.util';

import type { BudgetWindowSourceInterface } from '../src/budget/interface/budget-window-source.interface';

const MAIN_MONTHLY: BudgetWindowSourceInterface = {
    kind: BudgetKindEnum.MAIN,
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 8,
    useLastDayOfMonth: false,
    periodAnchorDate: null,
    startsAt: null,
    endsAt: null
};

it.effect('resolves a monthly main window from the start day', () =>
    Effect.sync(() => {
        const window = resolveBudgetWindow(MAIN_MONTHLY, new Date(2026, 9, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, 9, 8));
        expect(window.nextPeriodStart).toEqual(new Date(2026, 10, 8));
    })
);

it.effect('resolves a weekly main window from the anchor weekday', () =>
    Effect.sync(() => {
        const weekly = { ...MAIN_MONTHLY, period: BudgetPeriodEnum.WEEKLY, periodAnchorDate: new Date(2026, 9, 5) };
        const window = resolveBudgetWindow(weekly, new Date(2026, 9, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, 9, 26));
        expect(window.nextPeriodStart).toEqual(new Date(2026, 10, 2));
    })
);

it.effect('resolves an event window as the inclusive start and end days', () =>
    Effect.sync(() => {
        const event = { ...MAIN_MONTHLY, kind: BudgetKindEnum.EVENT, startsAt: new Date(2026, 10, 2), endsAt: new Date(2026, 10, 16) };
        const window = resolveBudgetWindow(event, new Date(2026, 9, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, 10, 2));
        expect(window.nextPeriodStart).toEqual(new Date(2026, 10, 17));
    })
);

it.effect('falls back to the cadence window for an event row missing its dates', () =>
    Effect.sync(() => {
        const brokenEvent = { ...MAIN_MONTHLY, kind: BudgetKindEnum.EVENT };
        const window = resolveBudgetWindow(brokenEvent, new Date(2026, 9, 29, 12));

        expect(window.periodStart).toEqual(new Date(2026, 9, 8));
    })
);
