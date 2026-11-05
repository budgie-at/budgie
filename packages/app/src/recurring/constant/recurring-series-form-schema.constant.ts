import { RecurringCadenceUnitEnum, RecurringSeriesKindEnum } from '@budgie/contracts';
import { startOfDay } from 'date-fns/startOfDay';
import * as Schema from 'effect/Schema';

import { RecurringEndModeEnum } from '../enum/recurring-end-mode.enum';
import { RecurringReminderChoiceEnum } from '../enum/recurring-reminder-choice.enum';
import { RecurringRepeatChoiceEnum } from '../enum/recurring-repeat-choice.enum';

import { RECURRING_TITLE_MAX_LENGTH } from './recurring-title-max-length.constant';

import type { Mutable } from 'effect/Types';

const MAX_CADENCE_INTERVAL = 99;
const MAX_END_COUNT = 600;

export const RecurringSeriesFormSchema = Schema.Struct({
    kind: Schema.Enum(RecurringSeriesKindEnum),
    title: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(RECURRING_TITLE_MAX_LENGTH)),
    amount: Schema.Finite.check(Schema.isGreaterThan(0)),
    instrumentId: Schema.Number.check(Schema.isInt(), Schema.isGreaterThan(0)),
    categoryId: Schema.NullOr(Schema.Number),
    accountId: Schema.NullOr(Schema.Number),
    repeat: Schema.Enum(RecurringRepeatChoiceEnum),
    customInterval: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: MAX_CADENCE_INTERVAL })),
    customUnit: Schema.Enum(RecurringCadenceUnitEnum),
    anchorDate: Schema.Date,
    endMode: Schema.Enum(RecurringEndModeEnum),
    endsOn: Schema.Date,
    endsAfterCount: Schema.Number.check(Schema.isInt(), Schema.isBetween({ minimum: 1, maximum: MAX_END_COUNT })),
    reminder: Schema.Enum(RecurringReminderChoiceEnum)
}).check(
    Schema.makeFilter(
        values =>
            values.endMode !== RecurringEndModeEnum.ON_DATE ||
            startOfDay(values.endsOn) >= startOfDay(values.anchorDate) || { path: ['endsOn'], issue: '' }
    )
);

export type RecurringSeriesFormValues = Mutable<typeof RecurringSeriesFormSchema.Encoded>;
