import { isOutflowEntryType } from '@budgie/contracts';
import { useLingui } from '@lingui/react/macro';
import { isSameDay } from 'date-fns/isSameDay';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { TransactionsByDaySectionInterface } from '../interface/transactions-by-day-section.interface';
import type { TransactionsDayNetAmountInterface } from '../interface/transactions-day-net-amount.interface';
import type { LanguageEnum, TransactionWithRelationsEntityInterface } from '@budgie/contracts';
import type * as Atom from 'effect/reactivity/Atom';

const DEFAULT_LIMIT = 20;

const getDayNetAmount = (
    transactions: TransactionWithRelationsEntityInterface[],
    accountId: number | null
): TransactionsDayNetAmountInterface | null => {
    const accountEntries = transactions.flatMap(transaction => transaction.entries.filter(entry => entry.accountId === accountId));

    if (isEmptyArray(accountEntries)) {
        return null;
    }

    return {
        amount: accountEntries.reduce((sum, entry) => sum + (isOutflowEntryType(entry.type) ? -entry.amount : entry.amount), 0),
        instrumentSymbol: accountEntries[0].account.instrument.symbol
    };
};

const groupTransactionsByDay = (transactions: TransactionWithRelationsEntityInterface[]): TransactionWithRelationsEntityInterface[][] => {
    const days: TransactionWithRelationsEntityInterface[][] = [];

    for (const transaction of transactions) {
        const last = days.at(-1);
        const previous = last?.at(-1);

        if (isDefined(last) && isDefined(previous) && isSameDay(previous.operatedAt, transaction.operatedAt)) {
            last.push(transaction);
        } else {
            days.push([transaction]);
        }
    }

    return days;
};

export const useGetTransactionSectionsQuery = <Transaction extends TransactionWithRelationsEntityInterface, Failure>(
    getQueryAtom: (limit: number, language: LanguageEnum) => Atom.Atom<AsyncResult.AsyncResult<Transaction[], Failure>>,
    filterKey: string,
    accountId: number | null
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
    const sections: TransactionsByDaySectionInterface[] = groupTransactionsByDay(transactions).map(dayTransactions => ({
        title: formatDayTitle(dayTransactions[0].operatedAt),
        transactions: dayTransactions,
        netAmount: getDayNetAmount(dayTransactions, accountId)
    }));

    const loadMore = () => {
        if (hasMore) {
            setPagination({ queryKey, loadedCount: loadedCount * 2 });
        }
    };

    return AsyncResult.isInitial(result)
        ? { sections: [], isLoading: true, hasMore: true, loadMore }
        : { sections, isLoading: false, hasMore, loadMore };
};
