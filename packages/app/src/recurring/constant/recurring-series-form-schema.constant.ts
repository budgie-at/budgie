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
    instrumentId: Schema.Finite.check(Schema.isInt(), Schema.isGreaterThan(0)),
    categoryId: Schema.NullOr(Schema.Finite),
    accountId: Schema.NullOr(Schema.Finite),
    repeat: Schema.Enum(RecurringRepeatChoiceEnum),
    customInterval: Schema.Finite,
    customUnit: Schema.Enum(RecurringCadenceUnitEnum),
    anchorDate: Schema.Date,
    endMode: Schema.Enum(RecurringEndModeEnum),
    endsOn: Schema.Date,
    endsAfterCount: Schema.Finite,
    reminder: Schema.Enum(RecurringReminderChoiceEnum)
}).check(
    Schema.makeFilter(
        values =>
            values.repeat !== RecurringRepeatChoiceEnum.CUSTOM ||
            (Number.isInteger(values.customInterval) && values.customInterval >= 1 && values.customInterval <= MAX_CADENCE_INTERVAL) || {
                path: ['customInterval'],
                issue: 'Enter an interval from 1 to 99'
            }
    ),
    Schema.makeFilter(
        values =>
            values.endMode !== RecurringEndModeEnum.AFTER_COUNT ||
            (Number.isInteger(values.endsAfterCount) && values.endsAfterCount >= 1 && values.endsAfterCount <= MAX_END_COUNT) || {
                path: ['endsAfterCount'],
                issue: 'Enter a count from 1 to 600'
            }
    ),
    Schema.makeFilter(
        values =>
            values.endMode !== RecurringEndModeEnum.ON_DATE ||
            startOfDay(values.endsOn) >= startOfDay(values.anchorDate) || { path: ['endsOn'], issue: '' }
    )
);

export type RecurringSeriesFormValues = Mutable<typeof RecurringSeriesFormSchema.Encoded>;
