import { isOutflowEntryType } from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { isSameDay } from 'date-fns/isSameDay';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import { useState } from 'react';

import { isDefined, isEmptyArray } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../settings/hook/use-setting.hook';
import { selectStatisticsAmountTransaction } from '../utils/select-statistics-amount-transaction.util';

import type { TransactionsByDaySectionInterface } from '../interface/transactions-by-day-section.interface';
import type { TransactionsDayNetAmountInterface } from '../interface/transactions-day-net-amount.interface';
import type {
    InstrumentEntityInterface,
    LanguageEnum,
    TransactionEntryEntityInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import type * as Atom from 'effect/reactivity/Atom';

const DEFAULT_LIMIT = 20;

const getSignedAmount = (entry: Pick<TransactionEntryEntityInterface, 'type'>, amount: number) =>
    isOutflowEntryType(entry.type) ? -amount : amount;

const getDayNetAmount = (
    transactions: TransactionWithRelationsEntityInterface[],
    accountId: number | null,
    categoryIds: number[] | null,
    defaultInstrument: Pick<InstrumentEntityInterface, 'id' | 'symbol'>
): TransactionsDayNetAmountInterface | null => {
    const entries = transactions.flatMap(transaction =>
        selectStatisticsAmountTransaction(transaction, categoryIds).entries.filter(
            entry => !isDefined(accountId) || entry.accountId === accountId
        )
    );

    if (isEmptyArray(entries)) {
        return null;
    }

    if (new Set(entries.map(entry => entry.account.instrument.id)).size === 1) {
        return {
            amount: entries.reduce((sum, entry) => sum + getSignedAmount(entry, entry.amount), 0),
            instrumentSymbol: entries[0].account.instrument.symbol,
            isApproximate: false
        };
    }

    if (entries.some(entry => !isDefined(entry.baseAmount) || entry.baseInstrumentId !== defaultInstrument.id)) {
        return null;
    }

    return {
        amount: entries.reduce((sum, entry) => sum + getSignedAmount(entry, entry.baseAmount ?? 0), 0),
        instrumentSymbol: defaultInstrument.symbol,
        isApproximate: true
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
    accountId: number | null,
    categoryIds: number[] | null = null
) => {
    const { t } = useLingui();
    const defaultInstrument = useAtomValue(defaultInstrumentAtom);
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
        netAmount: getDayNetAmount(dayTransactions, accountId, categoryIds, defaultInstrument)
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
