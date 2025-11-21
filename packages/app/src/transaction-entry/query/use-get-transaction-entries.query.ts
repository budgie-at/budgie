import { TransactionEntryWithRelationsEntityInterface } from '@budgie/contracts';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { transactionEntryRepository } from '../../@generic/drizzle/db/db';

interface Section {
    date: string;
    entries: TransactionEntryWithRelationsEntityInterface[];
}

const DEFAULT_LIMIT = 20;

const groupByMonth = (entries: TransactionEntryEntityInterface[]): Section[] => {
    const sections: Section[] = [];


    for (const entry of entries) {
        const date = new Date(entry.transaction.operatedAt);
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const last = sections.at(-1);

        if (last?.date === month) {
            last.entries.push(entry);
        } else {
            sections.push({ date: month, entries: [entry] });
        }
    }

    return sections;
};

export const useGetTransactionEntriesQuery = () => {
    const [loadedCount, setLoadedCount] = useState(DEFAULT_LIMIT);

    const { data, error, updatedAt } = useLiveQuery(transactionEntryRepository.getAll(loadedCount + 1));

    const hasMore = data.length > loadedCount;
    const sections = groupByMonth(hasMore ? data.slice(0, -1) : data);

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
