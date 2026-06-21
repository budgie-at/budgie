import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useDatabaseRefreshVersion } from '../../@generic/hook/use-database-refresh-version.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetTotalIncomeAndExpensesQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const databaseRefreshVersion = useDatabaseRefreshVersion();
    const { data } = useLiveQuery(statisticsRepository.getTotalIncomeAndExpenseQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id,
        databaseRefreshVersion
    ]);
    const { income, expense } = data.at(0) ?? { income: 0, expense: 0 };

    return { income: convertFromMicroUnits(income), expense: convertFromMicroUnits(expense) };
};
