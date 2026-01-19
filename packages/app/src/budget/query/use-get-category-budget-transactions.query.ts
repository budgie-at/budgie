import { TransactionTypeEnum } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { TransactionsByMonthSection } from '../../transaction/interface/transactions-by-month-section.interface';
import { groupTransactionsByMonth } from '../../transaction/utils/group-transactions-by-month.util';

const DEFAULT_LIMIT = 20;

interface UseCategoryBudgetTransactionsQueryParams {
    readonly categoryId: number;
    readonly startDate: Date;
    readonly endDate: Date;
}

export const useGetCategoryBudgetTransactionsQuery = ({ categoryId, startDate, endDate }: UseCategoryBudgetTransactionsQueryParams) => {
    const { formatMonthAndYear } = useFormatDate();
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);

    const { data, error, updatedAt } = useLiveQuery(
        transactionRepository.getAll(loadedCount + 1, {
            types: [TransactionTypeEnum.EXPENSE],
            date: { from: startDate, to: endDate },
            categoryIds: [categoryId],
            accountIds: null,
            tagIds: null
        }),
        [loadedCount, categoryId, startDate, endDate]
    );

    const hasMore = data.length > loadedCount;
    const transactions = hasMore ? data.slice(0, -1) : data;
    const sections: TransactionsByMonthSection[] = groupTransactionsByMonth(transactions, formatMonthAndYear);

    const loadMore = () => {
        if (hasMore) {
            setLoadedCount(previousCount => previousCount + DEFAULT_LIMIT);
        }
    };

    return isDefined(updatedAt)
        ? { sections, isLoading: false, hasMore, loadMore, error: error ?? null }
        : { sections: [], isLoading: true, hasMore: true, loadMore, error: null };
};
