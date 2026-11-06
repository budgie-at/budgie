import { RecurringService } from '@budgie/recurring';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { RECURRING_READ_TABLES } from '../constant/recurring-read-tables.constant';

import { useRecurringNow } from './use-recurring-now.hook';

import type { RecurringSeriesDetailInterface } from '@budgie/recurring';

const recurringSeriesDetailAtom = databaseQueryFamily(
    RECURRING_READ_TABLES,
    RecurringService,
    (recurringService, [seriesId, nowTime]: readonly [number, number]) => recurringService.getSeriesDetail(seriesId, new Date(nowTime))
);

export const useRecurringSeriesDetail = (
    seriesId: number
): { readonly detail: RecurringSeriesDetailInterface | undefined; readonly isNotFound: boolean } => {
    const now = useRecurringNow();
    const result = useLiveAtomValue(recurringSeriesDetailAtom([seriesId, now.getTime()]));

    return { detail: AsyncResult.isSuccess(result) ? result.value : void 0, isNotFound: AsyncResult.isFailure(result) };
};
