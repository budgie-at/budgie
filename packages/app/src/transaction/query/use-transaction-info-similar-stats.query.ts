import { TransactionTypeEnum } from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

import type {
    SimilarTransactionMonthRowInterface,
    SimilarTransactionStatsInterface,
    SimilarTransactionStatsQueryInterface,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';

const SIMILAR_STATS_MONTHS = 6;

const getPrimaryAccountId = (transaction: TransactionWithRelationsEntityInterface): number => {
    if (transaction.type === TransactionTypeEnum.EXPENSE) {
        return transaction.fromAccountId ?? 0;
    }

    if (transaction.type === TransactionTypeEnum.INCOME) {
        return transaction.toAccountId ?? 0;
    }

    return 0;
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

export const useTransactionInfoSimilarStatsQuery = (transaction: TransactionWithRelationsEntityInterface) => {
    const [stats, setStats] = useState<SimilarTransactionStatsInterface | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isActive = true;
        const query = buildSimilarStatsQuery(transaction);

        if (!isDefined(query)) {
            setStats(null);
            setError(null);
            setIsLoading(false);

            return () => {
                isActive = false;
            };
        }

        setIsLoading(true);
        setError(null);

        transactionRepository
            .findSimilarStats(query)
            .then(result => {
                if (isActive) {
                    setStats(isDefined(result) ? fillSimilarStatsMonths(result, transaction.operatedAt) : null);
                    setIsLoading(false);
                }

                return null;
            })
            .catch((queryError: unknown) => {
                if (isActive) {
                    setStats(null);
                    setError(getErrorMessage(queryError));
                    setIsLoading(false);
                }
            });

        return () => {
            isActive = false;
        };
    }, [transaction]);

    return { stats, error, isLoading };
};
