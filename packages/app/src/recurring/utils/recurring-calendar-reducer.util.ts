import { RecurringCalendarActionTypeEnum } from '../enum/recurring-calendar-action-type.enum';
import { RecurringCalendarActionInterface } from '../interface/recurring-calendar-action.interface';
import { RecurringCalendarStateInterface } from '../interface/recurring-calendar-state.interface';

export const recurringCalendarReducer = (
    state: RecurringCalendarStateInterface,
    action: RecurringCalendarActionInterface
): RecurringCalendarStateInterface => {
    if (action.type === RecurringCalendarActionTypeEnum.MONTH_CHANGED) {
        return { displayYear: action.year, displayMonth: action.month };
    }

    if (state.selectedDay === action.day) {
        return { displayYear: state.displayYear, displayMonth: state.displayMonth };
    }

    return { ...state, selectedDay: action.day };
};
