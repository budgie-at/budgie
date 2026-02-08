import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { TransactionsByMonthSection } from '../interface/transactions-by-month-section.interface';
import { groupTransactionsByMonth } from '../utils/group-transactions-by-month.util';

import type { TransactionFilterInterface } from '@budgie/contracts';

const DEFAULT_LIMIT = 20;

export const useGetTransactionsQuery = (filters?: TransactionFilterInterface) => {
    const { formatMonthAndYear } = useFormatDate();
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);

    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getAll(loadedCount + 1, filters), [loadedCount, filters]);

    const hasMore = data.length > loadedCount;
    const transactions = hasMore ? data.slice(0, -1) : data;

    const sections: TransactionsByMonthSection[] = groupTransactionsByMonth(transactions, formatMonthAndYear);

    const loadMore = () => {
        if (hasMore) {
            setLoadedCount(prev => prev + DEFAULT_LIMIT);
        }
    };

    return isDefined(updatedAt)
        ? { sections, isLoading: false, hasMore, loadMore, error: error ?? null }
        : { sections: [], isLoading: true, hasMore: true, loadMore, error: null };
};
