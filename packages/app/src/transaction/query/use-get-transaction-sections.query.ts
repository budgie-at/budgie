import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { TransactionsByMonthSection } from '../interface/transactions-by-month-section.type';
import type { LanguageEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type * as Atom from 'effect/reactivity/Atom';

const DEFAULT_LIMIT = 20;

const groupTransactionsByMonth = (
    transactions: TransactionWithRelationsEntityInterface[],
    formatMonthAndYear: (date: Date | string) => string
): TransactionsByMonthSection[] => {
    const sections: TransactionsByMonthSection[] = [];

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

export const useGetTransactionSectionsQuery = <Transaction extends TransactionWithRelationsEntityInterface, Failure>(
    getQueryAtom: (limit: number, language: LanguageEnum) => Atom.Atom<AsyncResult.AsyncResult<Transaction[], Failure>>,
    filterKey: string
) => {
    const { formatMonthAndYear } = useFormatDate();
    const language = useSetting('language');
    const queryKey = `${filterKey}|${language}`;
    const [pagination, setPagination] = useState({ queryKey, loadedCount: DEFAULT_LIMIT });
    const loadedCount = pagination.queryKey === queryKey ? pagination.loadedCount : DEFAULT_LIMIT;

    const result = useLiveAtomValue(getQueryAtom(loadedCount + 1, language));
    const data = AsyncResult.getOrElse(result, () => []);
    const hasMore = data.length > loadedCount;
    const transactions = hasMore ? data.slice(0, -1) : data;
    const sections = groupTransactionsByMonth(transactions, formatMonthAndYear);

    const loadMore = () => {
        if (hasMore) {
            setPagination({ queryKey, loadedCount: loadedCount + DEFAULT_LIMIT });
        }
    };

    return AsyncResult.isInitial(result)
        ? { sections: [], isLoading: true, hasMore: true, loadMore }
        : { sections, isLoading: false, hasMore, loadMore };
};
