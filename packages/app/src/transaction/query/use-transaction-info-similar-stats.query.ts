import { TransactionViewRepository, TransactionTypeEnum } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

import type {
    SimilarTransactionMonthRowInterface,
    SimilarTransactionStatsInterface,
    SimilarTransactionStatsQueryInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';

const SIMILAR_STATS_MONTHS = 6;

const getPrimaryAccountId = (transaction: TransactionWithRelationsEntityInterface): number | null => {
    if (transaction.type === TransactionTypeEnum.EXPENSE) {
        return transaction.fromAccountId ?? 0;
    }

    if (transaction.type === TransactionTypeEnum.INCOME) {
        return transaction.toAccountId ?? 0;
    }

    return null;
};

const buildSimilarStatsQuery = (transaction: TransactionWithRelationsEntityInterface): SimilarTransactionStatsQueryInterface | null => {
    const accountId = getPrimaryAccountId(transaction);
    const categoryId = getTransactionCategoryEntries(transaction.entries).at(0)?.categoryId ?? null;
    const canFetch =
        isDefined(accountId) &&
        isPositiveNumber(accountId) &&
        (transaction.type === TransactionTypeEnum.EXPENSE || transaction.type === TransactionTypeEnum.INCOME);

    if (!canFetch) {
        return null;
    }

    return {
        transactionId: transaction.id,
        type: transaction.type,
        operatedAt: transaction.operatedAt,
        title: transaction.title,
        comment: transaction.comment,
        accountId,
        categoryId,
        months: SIMILAR_STATS_MONTHS
    };
};

const buildMonthKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');

    return `${year}-${month}`;
};

const buildSimilarMonthKeys = (operatedAt: Date): string[] =>
    Array.from({ length: SIMILAR_STATS_MONTHS }, (_, index) => {
        const monthDate = new Date(operatedAt);
        monthDate.setDate(1);
        monthDate.setHours(0, 0, 0, 0);
        monthDate.setMonth(monthDate.getMonth() - SIMILAR_STATS_MONTHS + 1 + index);

        return buildMonthKey(monthDate);
    });

const buildEmptyMonth = (monthKey: string, currencySymbol: string): SimilarTransactionMonthRowInterface => ({
    monthKey,
    totalAmount: 0,
    count: 0,
    currencySymbol
});

const fillSimilarStatsMonths = (stats: SimilarTransactionStatsInterface, operatedAt: Date): SimilarTransactionStatsInterface => {
    const monthMap = new Map(stats.months.map(month => [month.monthKey, month]));
    const months = buildSimilarMonthKeys(operatedAt).map(
        monthKey => monthMap.get(monthKey) ?? buildEmptyMonth(monthKey, stats.currencySymbol)
    );

    return { ...stats, months };
};

const similarStatsAtom = Atom.family((query: SimilarTransactionStatsQueryInterface | null) =>
    databaseQueryAtom(
        TRANSACTION_LIST_TABLES,
        isDefined(query)
            ? Effect.flatMap(TransactionViewRepository, transactionViewRepository =>
                  transactionViewRepository.findSimilarStats(query)
              ).pipe(Effect.map(result => (isDefined(result) ? fillSimilarStatsMonths(result, query.operatedAt) : null)))
            : Effect.succeed(null)
    )
);

export const useTransactionInfoSimilarStatsQuery = (transaction: TransactionWithRelationsEntityInterface) => {
    const result = useLiveAtomValue(similarStatsAtom(buildSimilarStatsQuery(transaction)));

    return { stats: AsyncResult.isSuccess(result) ? result.value : null, isLoading: result.waiting };
};
