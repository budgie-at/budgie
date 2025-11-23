import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';

import type { TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';

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

export const useGetTransactionsQuery = () => {
    const { formatMonthAndYear } = useFormatDate();
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);

    const { data, error, updatedAt } = useLiveQuery(transactionRepository.getAll(loadedCount + 1), [loadedCount]);

    const hasMore = data.length > loadedCount;
    const transactions = hasMore ? data.slice(0, -1) : data;

    const sorted = transactions.sort((transactionA, transactionB) => {
        return new Date(transactionB.operatedAt).getTime() - new Date(transactionA.operatedAt).getTime();
    });
    const sections = groupByMonth(sorted, formatMonthAndYear);

    const loadMore = () => {
        if (hasMore) {
            setLoadedCount(prev => prev + DEFAULT_LIMIT);
        }
    };

    if (!isDefined(updatedAt)) {
        return { sections: [], isLoading: true, hasMore: true, loadMore, error: null };
    }

    return { sections, isLoading: false, hasMore, loadMore, error: error ?? null };
};
