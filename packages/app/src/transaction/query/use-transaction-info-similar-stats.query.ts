import { TransactionViewRepository, TransactionTypeEnum } from '@budgie/contracts';
import { getTransactionCategoryEntries } from '@budgie/ledger';
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { subMonths } from 'date-fns/subMonths';
import * as Effect from 'effect/Effect';
import * as AsyncResult from 'effect/reactivity/AsyncResult';
import * as Atom from 'effect/reactivity/Atom';

import { isDefined, isPositiveNumber } from '@rnw-community/shared';

import { useLiveAtomValue } from '../../@generic/hook/use-live-atom-value.hook';
import { databaseQueryAtom } from '../../@generic/utils/database-query-atom.util';
import { TRANSACTION_LIST_TABLES } from '../constant/transaction-list-tables.constant';

import type {
    SimilarTransactionMonthRowInterface,
    SimilarTransactionStatsInterface,
    SimilarTransactionStatsQueryInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';

const SIMILAR_STATS_MONTHS = 6;

const getPrimaryAccountId = (transaction: TransactionWithRelationsEntityInterface): number | null => {
    if (transaction.type === TransactionTypeEnum.EXPENSE) {
        return transaction.fromAccountId;
    }

    if (transaction.type === TransactionTypeEnum.INCOME) {
        return transaction.toAccountId;
    }

    return null;
};

const buildSimilarStatsQuery = (transaction: TransactionWithRelationsEntityInterface): SimilarTransactionStatsQueryInterface | null => {
    const accountId = getPrimaryAccountId(transaction);
    const categoryId = getTransactionCategoryEntries(transaction.entries).at(0)?.categoryId ?? null;
    const canFetch =
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

const buildSimilarMonthKeys = (operatedAt: Date): string[] =>
    Array.from({ length: SIMILAR_STATS_MONTHS }, (_, index) =>
        format(startOfMonth(subMonths(operatedAt, SIMILAR_STATS_MONTHS - 1 - index)), 'yyyy-MM')
    );

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
