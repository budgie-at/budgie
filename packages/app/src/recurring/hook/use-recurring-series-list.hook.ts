import { RecurringService } from '@budgie/recurring';
import { useAtomRefresh } from '@effect/atom-react/Hooks';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { RECURRING_READ_TABLES } from '../constant/recurring-read-tables.constant';

import { useRecurringNow } from './use-recurring-now.hook';

const recurringSeriesListAtom = databaseQueryFamily(RECURRING_READ_TABLES, RecurringService, (recurringService, nowTime: number) =>
    recurringService.listSeries(new Date(nowTime))
);

export const useRecurringSeriesList = () => {
    const now = useRecurringNow();
    const atom = recurringSeriesListAtom(now.getTime());
    const result = useLiveAtomValue(atom);
    const retry = useAtomRefresh(atom);

    return {
        now,
        series: AsyncResult.isSuccess(result) ? result.value : void 0,
        isLoading: AsyncResult.isInitial(result),
        isFailure: AsyncResult.isFailure(result),
        retry
    };
};
