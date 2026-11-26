import { RecurringService } from '@budgie/recurring';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { RECURRING_READ_TABLES } from '../constant/recurring-read-tables.constant';

import { useRecurringNow } from './use-recurring-now.hook';

export const recurringCalendarAtom = databaseQueryFamily(
    RECURRING_READ_TABLES,
    RecurringService,
    (recurringService, [year, month, nowTime]: readonly [number, number, number]) =>
        recurringService.calendar(year, month, new Date(nowTime))
);

export const useRecurringCalendar = (displayYear: number, displayMonth: number) => {
    const now = useRecurringNow();
    const atom = recurringCalendarAtom([displayYear, displayMonth, now.getTime()]);
    const result = useLiveAtomValue(atom);
    const retry = useAtomRefresh(atom);

    return {
        data: AsyncResult.isSuccess(result) ? result.value : void 0,
        isLoading: AsyncResult.isInitial(result),
        isFailure: AsyncResult.isFailure(result),
        retry
    };
};
