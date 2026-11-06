import { RecurringCalendarActionTypeEnum } from '../enum/recurring-calendar-action-type.enum';

export type RecurringCalendarActionInterface =
    | { readonly type: RecurringCalendarActionTypeEnum.DAY_TOGGLED; readonly day: number }
    | { readonly type: RecurringCalendarActionTypeEnum.MONTH_CHANGED; readonly year: number; readonly month: number };
