import { expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import { makeRecurringSeriesFormSchema } from '../src/recurring/constant/recurring-series-form-schema.constant';
import { RecurringEndModeEnum } from '../src/recurring/enum/recurring-end-mode.enum';
import { RecurringReminderChoiceEnum } from '../src/recurring/enum/recurring-reminder-choice.enum';
import { RecurringRepeatChoiceEnum } from '../src/recurring/enum/recurring-repeat-choice.enum';
import { buildDefaultRecurringFormValues } from '../src/recurring/utils/build-default-recurring-form-values.util';
import { resolveRecurringSchedule } from '../src/recurring/utils/resolve-recurring-schedule.util';
const VALUES = { ...buildDefaultRecurringFormValues(1, new Date(2026, 0, 31)), title: 'Rent', amount: 12 };
it.effect('validates custom interval only while custom repeats are selected', () =>
    Effect.sync(() => {
        expect(
            Schema.decodeExit(makeRecurringSeriesFormSchema(null))({
                ...VALUES,
                repeat: RecurringRepeatChoiceEnum.MONTHLY,
                customInterval: 0
            })._tag
        ).toBe('Success');
        expect(
            Schema.decodeExit(makeRecurringSeriesFormSchema(null))({
                ...VALUES,
                repeat: RecurringRepeatChoiceEnum.CUSTOM,
                customInterval: 0
            })._tag
        ).toBe('Failure');
    })
);
it.effect('validates the end count only while after-count is selected', () =>
    Effect.sync(() => {
        expect(
            Schema.decodeExit(makeRecurringSeriesFormSchema(null))({ ...VALUES, endMode: RecurringEndModeEnum.NEVER, endsAfterCount: 0 })
                ._tag
        ).toBe('Success');
        expect(
            Schema.decodeExit(makeRecurringSeriesFormSchema(null))({
                ...VALUES,
                endMode: RecurringEndModeEnum.AFTER_COUNT,
                endsAfterCount: 0
            })._tag
        ).toBe('Failure');
    })
);

it.effect('defaults reminders off', () =>
    Effect.sync(() => {
        expect(VALUES.reminder).toBe(RecurringReminderChoiceEnum.OFF);
    })
);
it.effect('counts remaining payments on the persisted month-end anchor', () =>
    Effect.sync(() => {
        const resolved = resolveRecurringSchedule(
            { ...VALUES, anchorDate: new Date(2026, 0, 31), endMode: RecurringEndModeEnum.AFTER_COUNT, endsAfterCount: 2 },
            new Date(2026, 1, 28)
        );
        expect(resolved.endsAt).toEqual(new Date(2026, 2, 31));
    })
);

it.effect('allows ending an existing series before its next payment', () =>
    Effect.sync(() => {
        const values = {
            ...VALUES,
            endMode: RecurringEndModeEnum.ON_DATE,
            anchorDate: new Date(2026, 10, 20),
            endsOn: new Date(2026, 10, 6)
        };
        expect(Schema.decodeExit(makeRecurringSeriesFormSchema(new Date(2026, 0, 20)))(values)._tag).toBe('Success');
        expect(Schema.decodeExit(makeRecurringSeriesFormSchema(null))(values)._tag).toBe('Failure');
        expect(Schema.decodeExit(makeRecurringSeriesFormSchema(new Date(2026, 10, 7)))(values)._tag).toBe('Failure');
        const resolved = resolveRecurringSchedule({ ...values, anchorDate: new Date(2026, 0, 20) }, new Date(2026, 10, 20));
        expect(resolved.anchorDate).toEqual(new Date(2026, 0, 20));
        expect(resolved.endsAt).toEqual(new Date(2026, 10, 6));
    })
);
