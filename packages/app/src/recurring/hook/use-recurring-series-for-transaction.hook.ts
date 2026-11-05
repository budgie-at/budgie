import { RecurringService } from '@budgie/recurring';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { RECURRING_READ_TABLES } from '../constant/recurring-read-tables.constant';

export const recurringSeriesForTransactionAtom = databaseQueryFamily(
    RECURRING_READ_TABLES,
    RecurringService,
    (recurringService, transactionId: number) => recurringService.seriesForTransaction(transactionId)
);

export const useRecurringSeriesForTransaction = (transactionId: number) => {
    const result = useLiveAtomValue(recurringSeriesForTransactionAtom(transactionId));

    return { seriesId: AsyncResult.isSuccess(result) ? (result.value?.id ?? null) : null, isLoading: !AsyncResult.isSuccess(result) };
};
