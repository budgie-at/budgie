import { TRANSFER_MCC_GROUP_ID } from '../../constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../constant/transfer-pair-fast-time-window.constant';
import {
    TRANSFER_PAIR_INTERBANK_HINTED_FEE_TIME_WINDOW_SECONDS,
    TRANSFER_PAIR_SAME_BANK_HINTED_FEE_TIME_WINDOW_SECONDS
} from '../../constant/transfer-pair-hinted-fee.constant';
import { TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE } from '../../constant/transfer-pair-implied-rate-tolerance.constant';

export const TRANSFER_PAIR_RANKED_CANDIDATE_RANK_SQL = `            scored_pairs AS (
                SELECT
                    *,
                    CASE
                        WHEN expenseInstrumentId != incomeInstrumentId
                            AND expenseEntryAmount > 0
                            AND incomeEntryAmount > 0
                            AND expenseExternalSource IS NOT NULL
                            AND expenseExternalSource != ''
                            AND expenseExternalSource = incomeExternalSource
                            AND (expenseMccGroupId IS NULL OR expenseMccGroupId = ${TRANSFER_MCC_GROUP_ID})
                            AND (incomeMccGroupId IS NULL OR incomeMccGroupId = ${TRANSFER_MCC_GROUP_ID})
                            AND expectedExchangeRate IS NOT NULL
                            AND ABS(impliedExchangeRate - expectedExchangeRate) / expectedExchangeRate <= ${TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE}
                        THEN 1
                        ELSE 0
                    END as impliedRateMatch,
                    SUM(
                        CASE
                            WHEN interbankHintedFeeAmountMatch = 1
                                AND timeDiff <= ${TRANSFER_PAIR_INTERBANK_HINTED_FEE_TIME_WINDOW_SECONDS}
                            THEN 1
                            ELSE 0
                        END
                    ) OVER (PARTITION BY expenseTransactionId) as interbankExpenseCandidateCount,
                    SUM(
                        CASE
                            WHEN interbankHintedFeeAmountMatch = 1
                                AND timeDiff <= ${TRANSFER_PAIR_INTERBANK_HINTED_FEE_TIME_WINDOW_SECONDS}
                            THEN 1
                            ELSE 0
                        END
                    ) OVER (PARTITION BY incomeTransactionId) as interbankIncomeCandidateCount
                FROM scored_pairs_base
            ),
            compatible_pairs AS (
                SELECT
                    *,
                    CASE
                        WHEN ibanMatch = 1
                            AND (sameCurrencyAmountMatch = 1 OR operationAmountMatch = 1)
                        THEN 'AUTO_IBAN_AMOUNT'
                        WHEN hasTransferMcc = 1
                            AND sameCurrencyAmountMatch = 1
                        THEN 'AUTO_SAME_CURRENCY_AMOUNT'
                        WHEN hasTransferMcc = 1
                            AND operationAmountMatch = 1
                            AND timeDiff <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        THEN 'AUTO_CROSS_CURRENCY_OPERATION'
                        WHEN impliedRateMatch = 1
                            AND timeDiff <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        THEN 'AUTO_CROSS_CURRENCY_IMPLIED_RATE'
                        WHEN sameBank = 1
                            AND ibanMatch = 0
                            AND sameCurrency = 0
                            AND expenseEntryAmount > 0
                            AND incomeEntryAmount > 0
                            AND (expenseMccGroupId IS NULL OR expenseMccGroupId = ${TRANSFER_MCC_GROUP_ID})
                            AND (incomeMccGroupId IS NULL OR incomeMccGroupId = ${TRANSFER_MCC_GROUP_ID})
                            AND timeDiff <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        THEN 'AUTO_SAME_BANK_CROSS_CURRENCY'
                        WHEN sameBank = 1
                            AND sameCurrency = 1
                            AND expenseMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                            AND incomeMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                            AND hintedFeeAmountMatch = 1
                            AND timeDiff <= ${TRANSFER_PAIR_SAME_BANK_HINTED_FEE_TIME_WINDOW_SECONDS}
                        THEN 'AUTO_SAME_BANK_HINTED_FEE'
                        WHEN interbankHintedFeeAmountMatch = 1
                            AND timeDiff <= ${TRANSFER_PAIR_INTERBANK_HINTED_FEE_TIME_WINDOW_SECONDS}
                            AND interbankExpenseCandidateCount = 1
                            AND interbankIncomeCandidateCount = 1
                        THEN 'AUTO_INTERBANK_HINTED_FEE'
                        WHEN hasTransferMcc = 1
                            AND operationAmountMatch = 1
                        THEN 'REVIEW_CROSS_CURRENCY_OPERATION'
                        ELSE NULL
                    END as confidenceBucket,
                    CASE
                        WHEN ibanMatch = 1 THEN 'iban'
                        WHEN operationAmountMatch = 1 THEN 'operation-amount'
                        WHEN impliedRateMatch = 1 THEN 'implied-rate'
                        WHEN sameBank = 1 AND sameCurrency = 0 THEN 'same-bank-cross-currency'
                        WHEN hintedFeeAmountMatch = 1 THEN 'same-bank-hinted-fee'
                        WHEN interbankHintedFeeAmountMatch = 1 THEN 'interbank-hinted-fee'
                        ELSE 'amount'
                    END as matchType
                FROM scored_pairs
            ),
            ranked_pairs AS (
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY expenseTransactionId
                        ORDER BY
                            CASE confidenceBucket
                                WHEN 'AUTO_IBAN_AMOUNT' THEN 1
                                WHEN 'AUTO_SAME_CURRENCY_AMOUNT' THEN 2
                                WHEN 'AUTO_CROSS_CURRENCY_OPERATION' THEN 3
                                WHEN 'AUTO_CROSS_CURRENCY_IMPLIED_RATE' THEN 4
                                WHEN 'AUTO_SAME_BANK_CROSS_CURRENCY' THEN 5
                                WHEN 'AUTO_SAME_BANK_HINTED_FEE' THEN 6
                                WHEN 'AUTO_INTERBANK_HINTED_FEE' THEN 7
                                WHEN 'REVIEW_CROSS_CURRENCY_OPERATION' THEN 8
                                ELSE 99
                            END,
                            timeDiff
                    ) as expenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY incomeTransactionId
                        ORDER BY
                            CASE confidenceBucket
                                WHEN 'AUTO_IBAN_AMOUNT' THEN 1
                                WHEN 'AUTO_SAME_CURRENCY_AMOUNT' THEN 2
                                WHEN 'AUTO_CROSS_CURRENCY_OPERATION' THEN 3
                                WHEN 'AUTO_CROSS_CURRENCY_IMPLIED_RATE' THEN 4
                                WHEN 'AUTO_SAME_BANK_CROSS_CURRENCY' THEN 5
                                WHEN 'AUTO_SAME_BANK_HINTED_FEE' THEN 6
                                WHEN 'AUTO_INTERBANK_HINTED_FEE' THEN 7
                                WHEN 'REVIEW_CROSS_CURRENCY_OPERATION' THEN 8
                                ELSE 99
                            END,
                            timeDiff
                    ) as incomeRank
                FROM compatible_pairs
                WHERE confidenceBucket IS NOT NULL
            )
            SELECT * FROM ranked_pairs
`;
