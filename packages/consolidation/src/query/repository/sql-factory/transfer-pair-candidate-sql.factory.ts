import { buildTransferPairRankedCandidateSql } from './transfer-pair-ranked-candidate-sql.factory';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const buildTransferPairCandidatesSql = (scope: ConsolidationScanScopeInterface | null = null): string => {
    const rankedCandidateSql = buildTransferPairRankedCandidateSql(scope);

    return `
            SELECT
                confidenceBucket,
                expenseTransactionId,
                expenseTransactionTitle,
                expenseOperatedAt as operatedAt,
                expenseAccountId as expenseEntryAccountId,
                expenseEntryAmount,
                expenseEntryExchangeRate,
                expenseEntryToIban,
                incomeTransactionId,
                incomeTransactionTitle,
                incomeAccountId as incomeEntryAccountId,
                incomeEntryAmount,
                incomeEntryExchangeRate,
                timeDiff
            FROM (${rankedCandidateSql})
            WHERE expenseRank = 1
                AND incomeRank = 1
                AND confidenceBucket IN ('AUTO_IBAN_AMOUNT', 'AUTO_SAME_CURRENCY_AMOUNT', 'AUTO_CROSS_CURRENCY_OPERATION', 'AUTO_CROSS_CURRENCY_IMPLIED_RATE', 'AUTO_SAME_BANK_CROSS_CURRENCY', 'AUTO_CROSS_CURRENCY_BANK_RATE', 'AUTO_SAME_BANK_HINTED_FEE', 'AUTO_INTERBANK_HINTED_FEE')
        `;
};

export const TRANSFER_PAIR_MANUAL_REVIEW_COUNT_SQL = `
            SELECT CASE
                WHEN EXISTS (
                    SELECT 1
                    FROM transaction_entries
                    WHERE deleted_at IS NULL
                        AND original_transaction_id IS NULL
                        AND exchange_rate != 1
                )
                THEN (
                    SELECT COUNT(*)
                    FROM (${buildTransferPairRankedCandidateSql(null)})
                    WHERE expenseRank = 1
                        AND incomeRank = 1
                        AND confidenceBucket = 'REVIEW_CROSS_CURRENCY_OPERATION'
                )
                ELSE 0
            END AS count
        `;
