import { useLingui } from '@lingui/react/macro';
import { isSameDay } from 'date-fns/isSameDay';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { TransactionsByDaySectionInterface } from '../interface/transactions-by-day-section.interface';
import type { LanguageEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type * as Atom from 'effect/reactivity/Atom';

const DEFAULT_LIMIT = 20;

const groupTransactionsByDay = (
    transactions: TransactionWithRelationsEntityInterface[],
    formatDayTitle: (date: Date | string) => string
): TransactionsByDaySectionInterface[] => {
    const sections: TransactionsByDaySectionInterface[] = [];

    for (const transaction of transactions) {
        const last = sections.at(-1);
        const previous = last?.transactions.at(-1);

        if (isDefined(last) && isDefined(previous) && isSameDay(previous.operatedAt, transaction.operatedAt)) {
            last.transactions.push(transaction);
        } else {
            sections.push({ title: formatDayTitle(transaction.operatedAt), transactions: [transaction] });
        }
    }

    return sections;
};

export const useGetTransactionSectionsQuery = <Transaction extends TransactionWithRelationsEntityInterface, Failure>(
    getQueryAtom: (limit: number, language: LanguageEnum) => Atom.Atom<AsyncResult.AsyncResult<Transaction[], Failure>>,
    filterKey: string
) => {
    const { t } = useLingui();
    const { formatWeekdayAndDay } = useFormatDate();
    const language = useSetting('language');
    const queryKey = `${filterKey}|${language}`;
    const [pagination, setPagination] = useState({ queryKey, loadedCount: DEFAULT_LIMIT });
    const loadedCount = pagination.queryKey === queryKey ? pagination.loadedCount : DEFAULT_LIMIT;

    const result = useLiveAtomValue(getQueryAtom(loadedCount + 1, language));
    const data = AsyncResult.getOrElse(result, () => []);
    const hasMore = data.length > loadedCount;
    const transactions = hasMore ? data.slice(0, -1) : data;
    const formatDayTitle = (date: Date | string) => {
        if (isToday(date)) {
            return t`Today`;
        }

        return isYesterday(date) ? t`Yesterday` : formatWeekdayAndDay(date);
    };
    const sections = groupTransactionsByDay(transactions, formatDayTitle);

    const loadMore = () => {
        if (hasMore) {
            setPagination({ queryKey, loadedCount: loadedCount * 2 });
        }
    };

    return AsyncResult.isInitial(result)
        ? { sections: [], isLoading: true, hasMore: true, loadMore }
        : { sections, isLoading: false, hasMore, loadMore };
};
