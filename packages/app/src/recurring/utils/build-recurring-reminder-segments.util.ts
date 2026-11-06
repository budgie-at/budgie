import { i18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { RecurringReminderChoiceEnum } from '../enum/recurring-reminder-choice.enum';
const LABELS = {
    [RecurringReminderChoiceEnum.OFF]: msg`Off`,
    [RecurringReminderChoiceEnum.SAME_DAY]: msg`Same day`,
    [RecurringReminderChoiceEnum.ONE_DAY]: msg`1 day`,
    [RecurringReminderChoiceEnum.THREE_DAYS]: msg`3 days`
};
export const buildRecurringReminderSegments = (testId: (choice: RecurringReminderChoiceEnum) => string) =>
    Object.values(RecurringReminderChoiceEnum).map(value => ({ value, label: i18n._(LABELS[value]), testID: testId(value) }));
