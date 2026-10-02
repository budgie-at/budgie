import { StatisticsRepository } from '@budgie/contracts';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

import type { LanguageEnum, TransactionFilterInterface } from '@budgie/contracts';

const incomeByCategoryAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId, language]: readonly [TransactionFilterInterface, number, LanguageEnum]) =>
        statisticsRepository.getIncomeByCategoryQuery(filters, defaultInstrumentId, language)
);

const expenseByCategoryAtom = databaseQueryFamily(
    STATISTICS_TABLES,
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId, language]: readonly [TransactionFilterInterface, number, LanguageEnum]) =>
        statisticsRepository.getExpenseByCategoryQuery(filters, defaultInstrumentId, language)
);

export const useGetStatisticsByCategoryQuery = (filters: TransactionFilterInterface) => {
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const incomeResult = useLiveAtomValue(incomeByCategoryAtom([filters, defaultInstrument.id, language]));
    const expenseResult = useLiveAtomValue(expenseByCategoryAtom([filters, defaultInstrument.id, language]));

    return {
        incomeByCategory: AsyncResult.getOrElse(incomeResult, () => []),
        expenseByCategory: AsyncResult.getOrElse(expenseResult, () => [])
    };
};
