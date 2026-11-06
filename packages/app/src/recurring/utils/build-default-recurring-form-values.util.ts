import { RecurringCadenceUnitEnum, RecurringSeriesKindEnum } from '@budgie/contracts';
import { addYears } from 'date-fns/addYears';
import { startOfDay } from 'date-fns/startOfDay';

import { RecurringEndModeEnum } from '../enum/recurring-end-mode.enum';
import { RecurringReminderChoiceEnum } from '../enum/recurring-reminder-choice.enum';
import { RecurringRepeatChoiceEnum } from '../enum/recurring-repeat-choice.enum';

import type { RecurringSeriesFormValues } from '../constant/recurring-series-form-schema.constant';

const DEFAULT_END_COUNT = 12;

export const buildDefaultRecurringFormValues = (instrumentId: number, today: Date): RecurringSeriesFormValues => {
    const anchorDate = startOfDay(today);

    return {
        kind: RecurringSeriesKindEnum.EXPENSE,
        title: '',
        amount: 0,
        instrumentId,
        categoryId: null,
        accountId: null,
        repeat: RecurringRepeatChoiceEnum.MONTHLY,
        customInterval: 1,
        customUnit: RecurringCadenceUnitEnum.MONTH,
        anchorDate,
        endMode: RecurringEndModeEnum.NEVER,
        endsOn: addYears(anchorDate, 1),
        endsAfterCount: DEFAULT_END_COUNT,
        reminder: RecurringReminderChoiceEnum.OFF
    };
};
