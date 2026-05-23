import { buildTransferPairRankedCandidateSql } from './transfer-pair-ranked-candidate-sql.factory';

export const buildTransferPairCandidatesSql = (): string => {
    const rankedCandidateSql = buildTransferPairRankedCandidateSql();

    return `
            SELECT
                confidenceBucket,
                expenseTransactionId,
                expenseTransactionTitle,
                expenseTransactionComment,
                expenseOperatedAt as operatedAt,
                expenseEntryId,
                expenseAccountId as expenseEntryAccountId,
                expenseEntryAmount,
                expenseEntryExchangeRate,
                expenseEntryToIban,
                incomeTransactionId,
                incomeTransactionTitle,
                incomeEntryId,
                incomeAccountId as incomeEntryAccountId,
                incomeEntryAmount,
                incomeEntryExchangeRate,
                incomeEntryToIban,
                matchType,
                timeDiff
            FROM (${rankedCandidateSql})
            WHERE expenseRank = 1
                AND incomeRank = 1
                AND confidenceBucket IN ('AUTO_IBAN_AMOUNT', 'AUTO_SAME_CURRENCY_AMOUNT', 'AUTO_CROSS_CURRENCY_OPERATION', 'AUTO_CROSS_CURRENCY_IMPLIED_RATE', 'AUTO_SAME_BANK_HINTED_FEE', 'AUTO_INTERBANK_HINTED_FEE')
        `;
};

export const buildTransferPairManualReviewCandidatesSql = (): string => {
    const rankedCandidateSql = buildTransferPairRankedCandidateSql();

    return `
            SELECT
                confidenceBucket,
                expenseTransactionId,
                incomeTransactionId,
                expenseAccountTitle,
                incomeAccountTitle,
                expenseCurrency,
                incomeCurrency,
                expenseEntryAmount,
                incomeEntryAmount,
                expenseOperationAmount,
                incomeOperationAmount,
                expenseTransactionTitle,
                incomeTransactionTitle,
                timeDiff
            FROM (${rankedCandidateSql})
            WHERE expenseRank = 1
                AND incomeRank = 1
                AND confidenceBucket IN ('REVIEW_CROSS_CURRENCY_OPERATION')
        `;
};
