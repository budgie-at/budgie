import { RecurringService } from '@budgie/recurring';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { RECURRING_READ_TABLES } from '../constant/recurring-read-tables.constant';

import { useRecurringNow } from './use-recurring-now.hook';

const recurringFittingSeriesAtom = databaseQueryFamily(
    RECURRING_READ_TABLES,
    RecurringService,
    (recurringService, [transactionId, nowTime]: readonly [number, number]) =>
        recurringService.fittingSeries(transactionId, new Date(nowTime))
);

export const useRecurringFittingSeries = (transactionId: number) => {
    const now = useRecurringNow();
    const result = useLiveAtomValue(recurringFittingSeriesAtom([transactionId, now.getTime()]));

    return {
        isFailed: AsyncResult.isFailure(result),
        now,
        fittingSeries: AsyncResult.isSuccess(result) ? result.value : [],
        isLoading: AsyncResult.isInitial(result)
    };
};
