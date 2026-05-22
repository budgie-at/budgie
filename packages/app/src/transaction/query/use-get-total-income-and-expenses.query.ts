import { TransactionFilterInterface } from '@budgie/contracts';

import { statisticsRepository } from '../../@generic/drizzle/db/db';
import { useLiveQuery } from '../../@generic/drizzle/hook/use-live-query.hook';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetTotalIncomeAndExpensesQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(statisticsRepository.getTotalIncomeAndExpenseQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);
    const rows = data ?? [];
    const { income, expense } = rows.at(0) ?? { income: 0, expense: 0 };

    return { income: convertFromMicroUnits(income), expense: convertFromMicroUnits(expense) };
};
