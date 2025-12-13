import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';

import type { TransactionFilterInterface, TransactionWithRelationsEntityInterface } from '@budgie/contracts';

interface Section {
    transactions: TransactionWithRelationsEntityInterface[];
    date: string;
}

const DEFAULT_LIMIT = 20;

const groupByMonth = (
    transactions: TransactionWithRelationsEntityInterface[],
    formatMonthAndYear: (date: Date | string) => string
): Section[] => {
    const sections: Section[] = [];

    for (const transaction of transactions) {
        const month = formatMonthAndYear(transaction.operatedAt);
        const last = sections.at(-1);

        if (last?.date === month) {
            last.transactions.push(transaction);
        } else {
            sections.push({ date: month, transactions: [transaction] });
        }
    }

    return sections;
};

export const useGetTransactionsQuery = (filters?: TransactionFilterInterface) => {
    const { formatMonthAndYear } = useFormatDate();
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);

    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getAll(loadedCount + 1, filters), [loadedCount, filters]);

    const hasMore = data.length > loadedCount;
    const transactions = hasMore ? data.slice(0, -1) : data;

    const sorted = transactions.sort(
        (transactionA, transactionB) => new Date(transactionB.operatedAt).getTime() - new Date(transactionA.operatedAt).getTime()
    );
    const sections = groupByMonth(sorted, formatMonthAndYear);

    const loadMore = () => {
        if (hasMore) {
            setLoadedCount(prev => prev + DEFAULT_LIMIT);
        }
    };

    return isDefined(updatedAt)
        ? { sections, isLoading: false, hasMore, loadMore, error: error ?? null }
        : { sections: [], isLoading: true, hasMore: true, loadMore, error: null };
};
