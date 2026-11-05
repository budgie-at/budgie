import { RECURRING_REMINDER_DAYS } from '../constant/recurring-reminder-days.constant';
import { RecurringReminderChoiceEnum } from '../enum/recurring-reminder-choice.enum';

export const getRecurringReminderChoice = (reminderDaysBefore: number | null): RecurringReminderChoiceEnum =>
    Object.values(RecurringReminderChoiceEnum).find(choice => RECURRING_REMINDER_DAYS[choice] === reminderDaysBefore) ??
    RecurringReminderChoiceEnum.OFF;
