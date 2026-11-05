import { RecurringService } from '@budgie/recurring';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { RECURRING_READ_TABLES } from '../constant/recurring-read-tables.constant';

import { useRecurringNow } from './use-recurring-now.hook';

import type { RecurringSeriesListItemInterface } from '@budgie/recurring';

export const recurringSeriesListAtom = databaseQueryFamily(RECURRING_READ_TABLES, RecurringService, (recurringService, nowTime: number) =>
    recurringService.listSeries(new Date(nowTime))
);

export const useRecurringSeriesList = (): {
    readonly now: Date;
    readonly series: readonly RecurringSeriesListItemInterface[] | undefined;
} => {
    const now = useRecurringNow();
    const result = useLiveAtomValue(recurringSeriesListAtom(now.getTime()));

    return { now, series: AsyncResult.isSuccess(result) ? result.value : void 0 };
};
