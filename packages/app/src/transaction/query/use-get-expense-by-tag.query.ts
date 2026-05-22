import { TransactionFilterInterface } from '@budgie/contracts';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetExpenseByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(statisticsRepository.getExpenseByTagQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);

    return { expenseByTag: data ?? [] };
};
