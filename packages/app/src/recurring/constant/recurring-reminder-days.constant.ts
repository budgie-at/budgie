import { RecurringReminderChoiceEnum } from '../enum/recurring-reminder-choice.enum';

export const RECURRING_REMINDER_DAYS: Record<RecurringReminderChoiceEnum, number | null> = {
    [RecurringReminderChoiceEnum.OFF]: null,
    [RecurringReminderChoiceEnum.SAME_DAY]: 0,
    [RecurringReminderChoiceEnum.ONE_DAY]: 1,
    [RecurringReminderChoiceEnum.THREE_DAYS]: 3
};
