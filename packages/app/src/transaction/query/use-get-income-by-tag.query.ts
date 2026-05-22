import { TransactionFilterInterface } from '@budgie/contracts';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetIncomeByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(statisticsRepository.getIncomeByTagQuery(filters, defaultInstrument.id), [filters, defaultInstrument.id]);

    return { incomeByTag: data ?? [] };
};
