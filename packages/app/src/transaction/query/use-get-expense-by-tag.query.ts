import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetExpenseByTagQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(transactionRepository.getExpenseByTagQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);

    return { expenseByTag: data };
};
