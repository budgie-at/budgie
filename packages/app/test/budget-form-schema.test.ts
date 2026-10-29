import { BudgetLimitSourceEnum, BudgetPeriodEnum, BudgetRolloverModeEnum } from '@budgie/contracts';
import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { BudgetEventFormSchema } from '../src/budget/constant/budget-event-form-schema.constant';
import { BudgetFormSchema } from '../src/budget/constant/budget-form-schema.constant';
import { BudgetFundFormSchema } from '../src/budget/constant/budget-fund-form-schema.constant';

import type { BudgetFormValues } from '../src/budget/constant/budget-form-schema.constant';

const FORM: BudgetFormValues = {
    name: 'Budget',
    period: BudgetPeriodEnum.MONTHLY,
    periodStartDay: 8,
    useLastDayOfMonth: false,
    periodAnchorMs: null,
    limitSource: BudgetLimitSourceEnum.FIXED,
    isAutoTuneEnabled: true,
    overallLimit: 1000,
    otherLimit: 100,
    otherRolloverMode: BudgetRolloverModeEnum.NONE,
    categoryLimits: [{ categoryId: 1, limitAmount: 300, rolloverMode: BudgetRolloverModeEnum.NONE }],
    instrumentId: 2
};

it.effect('accepts a fixed budget whose allocation fits the limit', () =>
    Effect.sync(() => {
        expect(Schema.is(BudgetFormSchema.from)(FORM)).toBe(true);
        expect(Schema.is(BudgetFormSchema.from)({ ...FORM, overallLimit: 0 })).toBe(false);
        expect(Schema.is(BudgetFormSchema.from)({ ...FORM, overallLimit: 350 })).toBe(true);
    })
);

it.effect('rejects a fixed budget whose allocation exceeds the limit', () =>
    Effect.sync(() => {
        const exit = Schema.decodeUnknownExit(BudgetFormSchema)({ ...FORM, overallLimit: 350 });

        expect(exit._tag).toBe('Failure');
    })
);

it.effect('does not require a fixed amount or a fitting allocation when the limit comes from income', () =>
    Effect.sync(() => {
        const incomeForm = { ...FORM, limitSource: BudgetLimitSourceEnum.INCOME_RECEIVED, overallLimit: 0, otherLimit: 5000 };

        expect(Schema.decodeUnknownExit(BudgetFormSchema)(incomeForm)._tag).toBe('Success');
    })
);

it.effect('requires an anchor date for non-monthly periods', () =>
    Effect.sync(() => {
        const weekly = { ...FORM, period: BudgetPeriodEnum.WEEKLY };

        expect(Schema.is(BudgetFormSchema.from)(weekly)).toBe(false);
        expect(Schema.is(BudgetFormSchema.from)({ ...weekly, periodAnchorMs: 1_000 })).toBe(true);
        expect(Schema.is(BudgetFormSchema.from)(FORM)).toBe(true);
    })
);

it.effect('forces the start day to 1 when the last day of the month is used', () =>
    Effect.sync(() => {
        const decoded = Schema.decodeUnknownSync(BudgetFormSchema)({ ...FORM, useLastDayOfMonth: true });

        expect(decoded.periodStartDay).toBe(1);
    })
);

it.effect('validates the fund form', () =>
    Effect.sync(() => {
        const fund = {
            name: 'Car',
            categoryId: 3,
            targetAmount: 900,
            dueAtMs: 1_800_000_000_000,
            repeatEveryMonths: 12,
            recurringSeriesId: null
        };

        expect(Schema.is(BudgetFundFormSchema)(fund)).toBe(true);
        expect(Schema.is(BudgetFundFormSchema)({ ...fund, name: '  ' })).toBe(false);
        expect(Schema.is(BudgetFundFormSchema)({ ...fund, targetAmount: 0 })).toBe(false);
        expect(Schema.is(BudgetFundFormSchema)({ ...fund, repeatEveryMonths: 0 })).toBe(false);
        expect(Schema.is(BudgetFundFormSchema)({ ...fund, repeatEveryMonths: null })).toBe(true);
    })
);

it.effect('validates the event form dates, tag and allocation', () =>
    Effect.sync(() => {
        const event = {
            name: 'Japan',
            tagId: 4,
            startsAtMs: 1_000,
            endsAtMs: 2_000,
            overallLimit: 3000,
            categoryLimits: [{ categoryId: 1, limitAmount: 1100, rolloverMode: BudgetRolloverModeEnum.NONE }],
            instrumentId: 2
        };

        expect(Schema.decodeUnknownExit(BudgetEventFormSchema)(event)._tag).toBe('Success');
        expect(Schema.decodeUnknownExit(BudgetEventFormSchema)({ ...event, endsAtMs: 500 })._tag).toBe('Failure');
        expect(Schema.decodeUnknownExit(BudgetEventFormSchema)({ ...event, tagId: 0 })._tag).toBe('Failure');
        expect(Schema.decodeUnknownExit(BudgetEventFormSchema)({ ...event, overallLimit: 1000 })._tag).toBe('Failure');
    })
);
