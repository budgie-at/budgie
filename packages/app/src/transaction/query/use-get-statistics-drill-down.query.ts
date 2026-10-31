import {
    CategoryEntityTable,
    DefaultCategoryTranslationEntityTable,
    StatisticsRepository,
    TagEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { endOfMonth, startOfMonth, subMonths } from 'date-fns';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { CategorizeInboxKindEnum } from '../../categorize-inbox/enum/categorize-inbox-kind.enum';
import { defaultInstrumentIdAtom } from '../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { STATISTICS_TABLES } from '../constant/statistics-tables.constant';

import type { StatisticsDrillDownKeyInterface } from '../interface/statistics-drill-down-key.interface';
import type { TransactionFilterInterface } from '@budgie/contracts';

const TREND_MONTH_COUNT = 6;

const statisticsDrillDownAtom = databaseQueryFamily(
    [...STATISTICS_TABLES, CategoryEntityTable, DefaultCategoryTranslationEntityTable, TagEntityTable],
    StatisticsRepository,
    (statisticsRepository, key: StatisticsDrillDownKeyInterface) => {
        const isIncome = key.type === TransactionTypeEnum.INCOME;
        const isCategory = key.kind === CategorizeInboxKindEnum.CATEGORY;
        const entityFilters = (filters: TransactionFilterInterface): TransactionFilterInterface =>
            isCategory ? { ...filters, categoryIds: [key.entityId] } : { ...filters, tagIds: [key.entityId] };
        const loadBreakdown = (filters: TransactionFilterInterface) => {
            if (isCategory) {
                const query = isIncome ? statisticsRepository.getIncomeByCategoryQuery : statisticsRepository.getExpenseByCategoryQuery;

                return Effect.map(query(entityFilters(filters), key.defaultInstrumentId, key.language), rows =>
                    rows.map(row => ({ id: row.category?.id ?? null, amount: row.amount, transactionCount: row.transactionCount }))
                );
            }

            const query = isIncome ? statisticsRepository.getIncomeByTagQuery : statisticsRepository.getExpenseByTagQuery;

            return Effect.map(query(entityFilters(filters), key.defaultInstrumentId), rows =>
                rows.map(row => ({ id: row.tag?.id ?? null, amount: row.amount, transactionCount: row.transactionCount }))
            );
        };
        const findEntity = (filters: TransactionFilterInterface) =>
            Effect.map(
                loadBreakdown(filters),
                rows => rows.find(row => row.id === key.entityId) ?? { id: key.entityId, amount: 0, transactionCount: 0 }
            );

        return Effect.all({
            entity: findEntity(key.filters),
            totals: statisticsRepository.getTotalIncomeAndExpenseQuery(key.filters, key.defaultInstrumentId),
            trend: Effect.forEach(key.trendMonths, month =>
                Effect.map(findEntity({ ...key.filters, date: { from: startOfMonth(month), to: endOfMonth(month) } }), entity => ({
                    month,
                    amount: entity.amount
                }))
            )
        }).pipe(
            Effect.map(({ entity, totals, trend }) => {
                const total = totals.at(0);
                const base = isIncome ? (total?.income ?? 0) : (total?.expense ?? 0);

                return { amount: entity.amount, transactionCount: entity.transactionCount, base, trend };
            })
        );
    }
);

export const useGetStatisticsDrillDownQuery = (
    kind: CategorizeInboxKindEnum,
    entityId: number,
    type: TransactionTypeEnum.INCOME | TransactionTypeEnum.EXPENSE,
    filters: TransactionFilterInterface
) => {
    const language = useSetting('language');
    const defaultInstrumentId = useAtomValue(defaultInstrumentIdAtom);
    const [now] = useState(() => new Date());
    const referenceMonth = startOfMonth(filters.date?.to ?? now);
    const trendMonths = Array.from({ length: TREND_MONTH_COUNT }, (_, index) => subMonths(referenceMonth, TREND_MONTH_COUNT - 1 - index));
    const result = useLiveAtomValue(statisticsDrillDownAtom({ kind, entityId, type, filters, trendMonths, defaultInstrumentId, language }));

    return {
        summary: AsyncResult.getOrElse(result, () => ({ amount: 0, transactionCount: 0, base: 0, trend: [] })),
        referenceMonth,
        isLoading: AsyncResult.isInitial(result)
    };
};
