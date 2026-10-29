import { DateFilterActionTypeEnum } from '../enum/date-filter-action-type.enum';
import { DateFilterActionInterface } from '../interface/date-filter-action.interface';
import { DateFilterStateInterface } from '../interface/date-filter-state.interface';

import { getCalendarVisibleDate } from './date/get-calendar-visible-date.util';

export const dateFilterReducer = (state: DateFilterStateInterface, action: DateFilterActionInterface): DateFilterStateInterface => {
    const visibleDate = getCalendarVisibleDate(action.range);

    if (action.type === DateFilterActionTypeEnum.PERIOD_SELECTED) {
        return { value: action.range, visibleDate, calendarResetKey: state.calendarResetKey + 1 };
    }

    return { ...state, value: action.range, visibleDate };
};
