import {
    SimilarTransactionStatsInterface,
    SimilarTransactionStatsQueryInterface,
    TransactionTypeEnum,
    TransactionWithRelationsEntityInterface
} from '@budgie/contracts';
import { useEffect, useState } from 'react';

import { getErrorMessage, isDefined, isPositiveNumber } from '@rnw-community/shared';

import { transactionRepository } from '../../@generic/drizzle/db/db';
import { TransactionInfoSimilarPeriodEnum } from '../enum/transaction-info-similar-period.enum';
import { getTransactionCategoryEntries } from '../utils/get-transaction-category-entries.util';

const PERIOD_MONTHS: Record<TransactionInfoSimilarPeriodEnum, number> = {
    [TransactionInfoSimilarPeriodEnum.SIX_MONTHS]: 6,
    [TransactionInfoSimilarPeriodEnum.TWELVE_MONTHS]: 12
};

const getPrimaryAccountId = (transaction: TransactionWithRelationsEntityInterface): number => {
    if (transaction.type === TransactionTypeEnum.EXPENSE) {
        return transaction.fromAccountId ?? 0;
    }

    if (transaction.type === TransactionTypeEnum.INCOME) {
        return transaction.toAccountId ?? 0;
    }

    return 0;
};

const buildSimilarStatsQuery = (
    transaction: TransactionWithRelationsEntityInterface,
    period: TransactionInfoSimilarPeriodEnum
): SimilarTransactionStatsQueryInterface | null => {
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
        months: PERIOD_MONTHS[period]
    };
};

export const useTransactionInfoSimilarStatsQuery = (
    transaction: TransactionWithRelationsEntityInterface,
    period: TransactionInfoSimilarPeriodEnum
) => {
    const [stats, setStats] = useState<SimilarTransactionStatsInterface | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        let isActive = true;
        const query = buildSimilarStatsQuery(transaction, period);

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
                    setStats(result);
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
    }, [period, transaction]);

    return { stats, error, isLoading };
};
