import { CategoryEntityTable, DefaultCategoryTranslationEntityTable, StatisticsRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useSettingsContext } from '../../settings/context/settings.context';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

import type { LanguageEnum, TransactionFilterInterface } from '@budgie/contracts';

export const statisticsByCategoryAtom = databaseQueryFamily(
    [...STATISTICS_TABLES, CategoryEntityTable, DefaultCategoryTranslationEntityTable],
    StatisticsRepository,
    (statisticsRepository, [filters, defaultInstrumentId, language]: readonly [TransactionFilterInterface, number, LanguageEnum]) =>
        Effect.all({
            incomeByCategory: statisticsRepository.getIncomeByCategoryQuery(filters, defaultInstrumentId, language),
            expenseByCategory: statisticsRepository.getExpenseByCategoryQuery(filters, defaultInstrumentId, language)
        })
);

export const useGetStatisticsByCategoryQuery = (filters: TransactionFilterInterface) => {
    const language = useSetting('language');
    const { defaultInstrument } = useSettingsContext();
    const result = useLiveAtomValue(statisticsByCategoryAtom([filters, defaultInstrument.id, language]));

    return AsyncResult.getOrElse(result, () => ({ incomeByCategory: [], expenseByCategory: [] }));
};
