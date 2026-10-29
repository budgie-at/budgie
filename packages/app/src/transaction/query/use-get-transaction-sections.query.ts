import {
    AccountEntityTable,
    InstrumentEntityTable,
    TransactionEntityTable,
    TransactionDayNetAmountRepository,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { useAtomValue } from '@effect/atom-react/Hooks';
import { useLingui } from '@lingui/react/macro';
import { endOfDay } from 'date-fns/endOfDay';
import { format } from 'date-fns/format';
import { isSameDay } from 'date-fns/isSameDay';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';
import { startOfDay } from 'date-fns/startOfDay';
import * as Option from 'effect/Option';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';
import { useState } from 'react';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryFamily } from '../../@generic/utils/database-query-family.util';
import { useFormatDate } from '../../i18n/hook/use-format-date.hook';
import { defaultInstrumentAtom } from '../../settings/constants/settings-atoms.constant';
import { useSetting } from '../../settings/hook/use-setting.hook';

import type { TransactionsByDaySectionInterface } from '../interface/transactions-by-day-section.interface';
import type { TransactionsDayNetAmountInterface } from '../interface/transactions-day-net-amount.interface';
import type {
    InstrumentEntityInterface,
    LanguageEnum,
    TransactionDayNetAmountRowInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';

const DEFAULT_LIMIT = 20;
const DAY_KEY_FORMAT = 'yyyy-MM-dd';

const dayNetAmountsAtom = databaseQueryFamily(
    [TransactionEntityTable, TransactionEntryEntityTable, AccountEntityTable, InstrumentEntityTable],
    TransactionDayNetAmountRepository,
    (transactionDayNetAmountRepository, [accountIds, from, to, defaultInstrumentId]: readonly [number[] | null, number, number, number]) =>
        transactionDayNetAmountRepository.getDayNetAmounts(accountIds, new Date(from), new Date(to), defaultInstrumentId)
);

const pendingDayNetAmountsAtom = Atom.make(AsyncResult.initial<TransactionDayNetAmountRowInterface[]>());

const hiddenDayNetAmountsAtom = Atom.make(AsyncResult.success<TransactionDayNetAmountRowInterface[]>([]));

const toDayNetAmount = (
    row: TransactionDayNetAmountRowInterface,
    defaultInstrument: Pick<InstrumentEntityInterface, 'symbol'>
): TransactionsDayNetAmountInterface | null => {
    if (row.instrumentCount === 1) {
        return { amount: row.amount, instrumentSymbol: row.instrumentSymbol, isApproximate: false };
    }

    return isPositiveNumber(row.unvaluedCount)
        ? null
        : { amount: row.baseAmount, instrumentSymbol: defaultInstrument.symbol, isApproximate: true };
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
    dayTotalsAccountIds: Option.Option<number[] | null>
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
    const newestTransaction = transactions.at(0);
    const oldestTransaction = transactions.at(-1);

    const getDayNetAmountsAtom = () => {
        if (AsyncResult.isInitial(result)) {
            return pendingDayNetAmountsAtom;
        }

        if (Option.isNone(dayTotalsAccountIds) || !isDefined(newestTransaction) || !isDefined(oldestTransaction)) {
            return hiddenDayNetAmountsAtom;
        }

        return dayNetAmountsAtom([
            dayTotalsAccountIds.value,
            startOfDay(oldestTransaction.operatedAt).getTime(),
            endOfDay(newestTransaction.operatedAt).getTime(),
            defaultInstrument.id
        ]);
    };

    const dayNetAmountsResult = useLiveAtomValue(getDayNetAmountsAtom());
    const dayNetAmounts = new Map(
        AsyncResult.getOrElse(dayNetAmountsResult, () => []).map(row => [row.day, toDayNetAmount(row, defaultInstrument)])
    );

    const formatDayTitle = (date: Date | string) => {
        if (isToday(date)) {
            return t`Today`;
        }

        return isYesterday(date) ? t`Yesterday` : formatWeekdayAndDay(date);
    };
    const sections: TransactionsByDaySectionInterface[] = groupTransactionsByDay(transactions).map(dayTransactions => ({
        title: formatDayTitle(dayTransactions[0].operatedAt),
        transactions: dayTransactions,
        netAmount: dayNetAmounts.get(format(dayTransactions[0].operatedAt, DAY_KEY_FORMAT)) ?? null
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
