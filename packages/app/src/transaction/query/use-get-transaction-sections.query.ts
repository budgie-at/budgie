import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { TransactionsByMonthSection } from '../interface/transactions-by-month-section.type';
import { groupTransactionsByMonth } from '../utils/group-transactions-by-month.util';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type { SQLiteRelationalQuery } from 'drizzle-orm/sqlite-core/query-builders/query';

const DEFAULT_LIMIT = 20;

export const useGetTransactionSectionsQuery = <Transaction extends TransactionWithRelationsEntityInterface>(
    buildQuery: (limit: number) => SQLiteRelationalQuery<'sync', Transaction[]>,
    queryKey: string
) => {
    const { formatMonthAndYear } = useFormatDate();
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);

    useEffect(() => {
        setLoadedCount(DEFAULT_LIMIT);
    }, [queryKey]);

    const { data, error, updatedAt } = useLiveQuery(buildQuery(loadedCount + 1), [loadedCount, queryKey]);
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
