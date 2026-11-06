import { RecurringService } from '@budgie/recurring';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { RECURRING_READ_TABLES } from '../constant/recurring-read-tables.constant';

import { useRecurringNow } from './use-recurring-now.hook';

import type { RecurringCalendarDataInterface } from '@budgie/recurring';

export const recurringCalendarAtom = databaseQueryFamily(
    RECURRING_READ_TABLES,
    RecurringService,
    (recurringService, [year, month, nowTime]: readonly [number, number, number]) =>
        recurringService.calendar(year, month, new Date(nowTime))
);

export const useRecurringCalendar = (displayYear: number, displayMonth: number): RecurringCalendarDataInterface | undefined => {
    const now = useRecurringNow();
    const result = useLiveAtomValue(recurringCalendarAtom([displayYear, displayMonth, now.getTime()]));

    return AsyncResult.isSuccess(result) ? result.value : void 0;
};
