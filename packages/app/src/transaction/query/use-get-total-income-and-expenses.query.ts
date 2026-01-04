import { TransactionFilterInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { convertFromMicroUnits } from '../../@generic/utils/convert-from-micro-units.util';
import { useSettingsContext } from '../../settings/context/settings.context';

export const useGetTotalIncomeAndExpensesQuery = (filters: TransactionFilterInterface) => {
    const { defaultInstrument } = useSettingsContext();
    const { data } = useLiveQuery(transactionRepository.getTotalIncomeAndExpenseQuery(filters, defaultInstrument.id), [
        filters,
        defaultInstrument.id
    ]);
    const { income, expense } = data.at(0) ?? { income: 0, expense: 0 };

    return { income: convertFromMicroUnits(income), expense: convertFromMicroUnits(expense) };
};
