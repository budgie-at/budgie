import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetIncomeByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(transactionRepository.getIncomeByTagQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);

    return { incomeByTag: data };
};
