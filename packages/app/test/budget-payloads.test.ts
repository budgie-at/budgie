import { BudgetKindEnum, BudgetLimitSourceEnum, BudgetPeriodEnum, BudgetRolloverModeEnum, convertToMicroUnits } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { buildBudgetEventPayload } from '../src/budget/utils/build-budget-event-payload.util';
import { buildBudgetFundPayload } from '../src/budget/utils/build-budget-fund-payload.util';
import { buildBudgetPayload } from '../src/budget/utils/build-budget-payload.util';

it.effect('maps the main form to a service payload with micro units and a Date anchor', () =>
    Effect.sync(() => {
        const payload = buildBudgetPayload({
            name: 'Budget',
            period: BudgetPeriodEnum.WEEKLY,
            periodStartDay: 1,
            useLastDayOfMonth: false,
            periodAnchorMs: new Date(2026, 9, 26).getTime(),
            limitSource: BudgetLimitSourceEnum.INCOME_RECEIVED,
            isAutoTuneEnabled: false,
            overallLimit: 0,
            otherLimit: 50,
            otherRolloverMode: BudgetRolloverModeEnum.NONE,
            categoryLimits: [{ categoryId: 1, limitAmount: 20, rolloverMode: BudgetRolloverModeEnum.SURPLUS }],
            instrumentId: 2
        });

        expect(payload.period).toBe(BudgetPeriodEnum.WEEKLY);
        expect(payload.periodAnchorDate).toEqual(new Date(2026, 9, 26));
        expect(payload.limitSource).toBe(BudgetLimitSourceEnum.INCOME_RECEIVED);
        expect(payload.isAutoTuneEnabled).toBe(false);
        expect(payload.otherLimit).toBe(convertToMicroUnits(50));
        expect(payload.categoryLimits).toEqual([
            { categoryId: 1, limitAmount: convertToMicroUnits(20), rolloverMode: BudgetRolloverModeEnum.SURPLUS }
        ]);
    })
);

it.effect('keeps a null anchor for monthly budgets', () =>
    Effect.sync(() => {
        const payload = buildBudgetPayload({
            name: 'Budget',
            period: BudgetPeriodEnum.MONTHLY,
            periodStartDay: 8,
            useLastDayOfMonth: false,
            periodAnchorMs: null,
            limitSource: BudgetLimitSourceEnum.FIXED,
            isAutoTuneEnabled: true,
            overallLimit: 100,
            otherLimit: 0,
            otherRolloverMode: BudgetRolloverModeEnum.NONE,
            categoryLimits: [],
            instrumentId: 2
        });

        expect(payload.periodAnchorDate).toBeNull();
    })
);

it.effect('maps the fund form to a repository payload on the start of the due day', () =>
    Effect.sync(() => {
        const payload = buildBudgetFundPayload(
            {
                name: 'Car',
                categoryId: 3,
                targetAmount: 900,
                dueAtMs: new Date(2027, 2, 14, 15, 30).getTime(),
                repeatEveryMonths: 12,
                recurringSeriesId: 9
            },
            5
        );

        expect(payload).toEqual({
            budgetId: 5,
            name: 'Car',
            categoryId: 3,
            targetAmount: convertToMicroUnits(900),
            dueAt: new Date(2027, 2, 14),
            repeatEveryMonths: 12,
            recurringSeriesId: 9
        });
    })
);

it.effect('maps the event form to an EVENT budget without period tuning or rollover', () =>
    Effect.sync(() => {
        const payload = buildBudgetEventPayload({
            name: 'Japan',
            tagId: 4,
            startsAtMs: new Date(2026, 10, 2, 9).getTime(),
            endsAtMs: new Date(2026, 10, 16, 22).getTime(),
            overallLimit: 3000,
            categoryLimits: [{ categoryId: 1, limitAmount: 1100, rolloverMode: BudgetRolloverModeEnum.NONE }],
            instrumentId: 2
        });

        expect(payload.kind).toBe(BudgetKindEnum.EVENT);
        expect(payload.tagId).toBe(4);
        expect(payload.startsAt).toEqual(new Date(2026, 10, 2));
        expect(payload.endsAt).toEqual(new Date(2026, 10, 16));
        expect(payload.limitSource).toBe(BudgetLimitSourceEnum.FIXED);
        expect(payload.isAutoTuneEnabled).toBe(false);
        expect(payload.otherLimit).toBe(0);
        expect(payload.overallLimit).toBe(convertToMicroUnits(3000));
    })
);
