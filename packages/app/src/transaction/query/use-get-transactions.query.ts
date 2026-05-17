import { DEFAULT_TRANSACTION_FILTER } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useEffect, useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { TransactionsByMonthSection } from '../interface/transactions-by-month-section.type';
import { buildTransactionFilterKey } from '../utils/build-transaction-filter-key.util';
import { groupTransactionsByMonth } from '../utils/group-transactions-by-month.util';

import type { TransactionFilterInterface } from '@budgie/contracts';

const DEFAULT_LIMIT = 20;

export const useGetTransactionsQuery = (filters?: TransactionFilterInterface) => {
    const { formatMonthAndYear } = useFormatDate();
    const language = useSetting('language');
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);
    const filterKey = buildTransactionFilterKey(filters);

    useEffect(() => {
        setLoadedCount(DEFAULT_LIMIT);
    }, [filterKey]);

    const { data, error, updatedAt } = useLiveQuery(
        transactionRepository.getAll(loadedCount + 1, filters ?? DEFAULT_TRANSACTION_FILTER, language),
        [loadedCount, filterKey, language]
    );

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
