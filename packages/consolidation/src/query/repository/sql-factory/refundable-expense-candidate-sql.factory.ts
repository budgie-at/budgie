import {
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { buildPrivatbankSameOriginalAmountSql } from '../../../shared/utils/build-privatbank-same-original-amount-sql.util';

import type { LanguageEnum } from '@budgie/contracts';

const MANUAL_RECOMMENDED_AMOUNT_DISTANCE_RATIO = 0.05;
const MANUAL_RECOMMENDED_DATE_DISTANCE_SECONDS = 604_800;
const MANUAL_CANDIDATES_LIMIT = 80;

const ESCAPED_CANDIDATE_TITLE_SQL = `REPLACE(REPLACE(REPLACE(LOWER(candidate.title), '\\', '\\\\'), '%', '\\%'), '_', '\\_')`;

const CANDIDATE_PRIVATBANK_COLUMNS = {
    amount: 'candidate_entry.amount',
    exchangeRate: 'candidate_entry.exchange_rate',
    externalSource: 'candidate.external_source',
    operationInstrumentId: 'candidate_entry.operation_instrument_id'
} as const;

const buildManualRecommendedSql = (): string => `
    CASE
        WHEN candidate.title != '' AND current_tx.title != '' AND (
            LOWER(candidate.title) = LOWER(current_tx.title)
            OR LOWER(candidate.title) = LOWER('Скасування. ' || current_tx.title)
            OR LOWER(current_tx.title) = LOWER('Скасування. ' || candidate.title)
            OR LOWER(current_tx.title) LIKE ('скасування. ' || ${ESCAPED_CANDIDATE_TITLE_SQL} || ',%') ESCAPE '\\'
            OR LOWER(current_tx.title) LIKE ('Скасування. ' || ${ESCAPED_CANDIDATE_TITLE_SQL} || ',%') ESCAPE '\\'
            OR LOWER(candidate.title) = LOWER('ПОВЕРНЕННЯ КОШТІВ, ' || current_tx.title)
            OR LOWER(current_tx.title) = LOWER('ПОВЕРНЕННЯ КОШТІВ, ' || candidate.title)
            OR LOWER(current_tx.title) = LOWER('Повернення коштів, ' || candidate.title)
        ) THEN 1
        WHEN candidate_entry.amount = current_entry.amount THEN 1
        WHEN ABS(candidate_entry.amount - current_entry.amount) <= current_entry.amount * ?
            AND ABS(candidate.operated_at - current_tx.operated_at) <= ? THEN 1
        ELSE 0
    END
`;

const buildManualSearchSql = (): string => `
    AND (
        LOWER(candidate.title) LIKE ? ESCAPE '\\'
        OR LOWER(candidate.comment) LIKE ? ESCAPE '\\'
        OR LOWER(account.title) LIKE ? ESCAPE '\\'
        OR LOWER(COALESCE(translation.title, category.title, '')) LIKE ? ESCAPE '\\'
        OR LOWER(COALESCE(category.title, '')) LIKE ? ESCAPE '\\'
        OR LOWER(COALESCE(category.title_en, '')) LIKE ? ESCAPE '\\'
    )
`;

const buildManualCurrentTransactionSql = (): string => `
    current_tx AS (
        SELECT id, type, title, operated_at, external_source
        FROM transactions
        WHERE id = ?
          AND deleted_at IS NULL
          AND consolidation_parent_transaction_id IS NULL
          AND consolidation_type IS NULL
          AND type = '${TransactionTypeEnum.INCOME}'
    )
`;

const buildManualCurrentEntrySql = (): string => `
    current_entry AS (
        SELECT entry.amount, entry.exchange_rate, entry.operation_instrument_id, account.instrument_id
        FROM transaction_entries entry
        INNER JOIN current_tx ON current_tx.id = entry.transaction_id
        INNER JOIN accounts account ON account.id = entry.account_id
            AND account.deleted_at IS NULL
            AND account.is_external = 0
        WHERE entry.deleted_at IS NULL
          AND entry.original_transaction_id IS NULL
          AND entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
          AND entry.type = '${TransactionEntryTypeEnum.DEBIT}'
          AND entry.amount > 0
          AND NOT EXISTS (
              SELECT 1
              FROM transaction_entries sibling_entry INDEXED BY transaction_entries_transaction_idx
              WHERE sibling_entry.transaction_id = current_tx.id
                AND sibling_entry.deleted_at IS NULL
                AND sibling_entry.id != entry.id
          )
        LIMIT 1
    )
`;

const buildManualCandidateCapacitySql = (): string => `
      AND (
          candidate.consolidation_type IS NULL
          OR NOT EXISTS (
              SELECT 1
              FROM transaction_entries closing_entry INDEXED BY transaction_entries_refund_tx_idx
              INNER JOIN transactions closing_tx ON closing_tx.id = closing_entry.original_transaction_id
              WHERE closing_entry.transaction_id = candidate.id
                AND closing_entry.deleted_at IS NULL
                AND closing_entry.original_transaction_id IS NOT NULL
                AND closing_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                AND ${buildPrivatbankSameOriginalAmountSql(
                    {
                        amount: 'closing_entry.amount',
                        exchangeRate: 'closing_entry.exchange_rate',
                        externalSource: 'closing_tx.external_source',
                        operationInstrumentId: 'closing_entry.operation_instrument_id'
                    },
                    CANDIDATE_PRIVATBANK_COLUMNS
                )}
          )
      )
      AND (
          candidate_entry.amount >= current_entry.amount + CASE
              WHEN candidate.consolidation_type = '${TransactionConsolidationTypeEnum.REFUND}' THEN COALESCE((
                  SELECT SUM(refund_entry.amount)
                  FROM transaction_entries refund_entry INDEXED BY transaction_entries_refund_tx_idx
                  WHERE refund_entry.transaction_id = candidate.id
                    AND refund_entry.deleted_at IS NULL
                    AND refund_entry.original_transaction_id IS NOT NULL
                    AND refund_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
              ), 0)
              ELSE 0
          END
          OR (
              (
                  candidate.consolidation_type IS NULL
                  OR NOT EXISTS (
                      SELECT 1
                      FROM transaction_entries refund_entry INDEXED BY transaction_entries_refund_tx_idx
                      WHERE refund_entry.transaction_id = candidate.id
                        AND refund_entry.deleted_at IS NULL
                        AND refund_entry.original_transaction_id IS NOT NULL
                        AND refund_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                  )
              )
              AND ${buildPrivatbankSameOriginalAmountSql(
                  {
                      amount: 'current_entry.amount',
                      exchangeRate: 'current_entry.exchange_rate',
                      externalSource: 'current_tx.external_source',
                      operationInstrumentId: 'current_entry.operation_instrument_id'
                  },
                  CANDIDATE_PRIVATBANK_COLUMNS
              )}
          )
      )
`;

const buildManualCandidateWhereSql = (useAsciiSqlSearch: boolean): string => `
    WHERE candidate.id != current_tx.id
      AND candidate.deleted_at IS NULL
      AND candidate.consolidation_parent_transaction_id IS NULL
      AND candidate.operated_at <= current_tx.operated_at
      AND candidate.type = '${TransactionTypeEnum.EXPENSE}'
      AND (candidate.consolidation_type IS NULL OR candidate.consolidation_type = '${TransactionConsolidationTypeEnum.REFUND}')
      AND candidate_entry.deleted_at IS NULL
      AND candidate_entry.original_transaction_id IS NULL
      AND candidate_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
      AND candidate_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
      AND candidate_entry.amount > 0
      AND account.deleted_at IS NULL
      AND account.is_external = 0
      AND account.instrument_id = current_entry.instrument_id
      AND NOT EXISTS (
          SELECT 1
          FROM transaction_entries candidate_sibling_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
          WHERE candidate_sibling_entry.transaction_id = candidate.id
            AND candidate_sibling_entry.deleted_at IS NULL
            AND candidate_sibling_entry.original_transaction_id IS NULL
            AND candidate_sibling_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
            AND candidate_sibling_entry.id != candidate_entry.id
      )
      ${buildManualCandidateCapacitySql()}
      ${useAsciiSqlSearch ? buildManualSearchSql() : ''}
`;

const buildManualOrderBySql = (): string =>
    `ORDER BY isRecommended DESC, amount_distance ASC, date_distance ASC, candidate.operated_at DESC, candidate.id DESC`;

const buildManualCandidateBaseFromSql = (): string => `
    FROM transactions candidate
    INNER JOIN transaction_entries candidate_entry ON candidate_entry.transaction_id = candidate.id
    INNER JOIN accounts account ON account.id = candidate_entry.account_id
    INNER JOIN instruments instrument ON instrument.id = account.instrument_id
    LEFT JOIN categories category ON category.id = candidate_entry.category_id
    CROSS JOIN current_tx
    CROSS JOIN current_entry
`;

export const REFUNDABLE_EXPENSE_CANDIDATES_UNFILTERED_SQL = `
    WITH ${buildManualCurrentTransactionSql()},
    ${buildManualCurrentEntrySql()}
    SELECT
        matched.id AS id,
        matched.type AS type,
        matched.title AS title,
        matched.comment AS comment,
        matched.operatedAtMs AS operatedAtMs,
        matched.amount AS amount,
        matched.accountTitle AS accountTitle,
        matched.currencyCode AS currencyCode,
        matched.currencySymbol AS currencySymbol,
        COALESCE(
            (SELECT translation.title
             FROM default_category_translations translation
             WHERE translation.category_id = matched.categoryId
               AND translation.language = ?),
            matched.rawCategoryTitle
        ) AS categoryTitle,
        matched.categoryTitleEn AS categoryTitleEn,
        matched.categoryIcon AS categoryIcon,
        matched.isRecommended AS isRecommended
    FROM (
        SELECT
            candidate.id AS id,
            candidate.type AS type,
            candidate.title AS title,
            candidate.comment AS comment,
            candidate.operated_at * 1000 AS operatedAtMs,
            candidate_entry.amount AS amount,
            account.title AS accountTitle,
            instrument.code AS currencyCode,
            instrument.symbol AS currencySymbol,
            category.id AS categoryId,
            category.title AS rawCategoryTitle,
            category.title_en AS categoryTitleEn,
            category.icon AS categoryIcon,
            ${buildManualRecommendedSql()} AS isRecommended,
            ABS(candidate_entry.amount - current_entry.amount) AS amount_distance,
            ABS(candidate.operated_at - current_tx.operated_at) AS date_distance
        ${buildManualCandidateBaseFromSql()}
        ${buildManualCandidateWhereSql(false)}
        ${buildManualOrderBySql()}
        LIMIT ${MANUAL_CANDIDATES_LIMIT}
    ) matched
`;

export const buildRefundableExpenseCandidatesSearchSql = (useAsciiSqlSearch: boolean): string => `
    WITH ${buildManualCurrentTransactionSql()},
    ${buildManualCurrentEntrySql()}
    SELECT
        candidate.id AS id,
        candidate.type AS type,
        candidate.title AS title,
        candidate.comment AS comment,
        candidate.operated_at * 1000 AS operatedAtMs,
        candidate_entry.amount AS amount,
        account.title AS accountTitle,
        instrument.code AS currencyCode,
        instrument.symbol AS currencySymbol,
        COALESCE(translation.title, category.title) AS categoryTitle,
        category.title_en AS categoryTitleEn,
        category.icon AS categoryIcon,
        ${buildManualRecommendedSql()} AS isRecommended,
        ABS(candidate_entry.amount - current_entry.amount) AS amount_distance,
        ABS(candidate.operated_at - current_tx.operated_at) AS date_distance
    ${buildManualCandidateBaseFromSql()}
    LEFT JOIN default_category_translations translation
        ON translation.category_id = category.id
        AND translation.language = ?
    ${buildManualCandidateWhereSql(useAsciiSqlSearch)}
    ${buildManualOrderBySql()}
    ${useAsciiSqlSearch ? `LIMIT ${MANUAL_CANDIDATES_LIMIT}` : ''}
`;

export const REFUNDABLE_EXPENSE_CANDIDATES_LIMIT = MANUAL_CANDIDATES_LIMIT;

export const buildRefundableExpenseCandidateUnfilteredParams = (
    refundIncomeTransactionId: number,
    language: LanguageEnum
): (number | string)[] => [
    refundIncomeTransactionId,
    language,
    MANUAL_RECOMMENDED_AMOUNT_DISTANCE_RATIO,
    MANUAL_RECOMMENDED_DATE_DISTANCE_SECONDS
];

export const buildRefundableExpenseCandidateSearchParams = (
    refundIncomeTransactionId: number,
    language: LanguageEnum,
    escapedAsciiSearchPattern: string | null
): (number | string)[] => [
    refundIncomeTransactionId,
    MANUAL_RECOMMENDED_AMOUNT_DISTANCE_RATIO,
    MANUAL_RECOMMENDED_DATE_DISTANCE_SECONDS,
    language,
    ...(isDefined(escapedAsciiSearchPattern)
        ? [
              escapedAsciiSearchPattern,
              escapedAsciiSearchPattern,
              escapedAsciiSearchPattern,
              escapedAsciiSearchPattern,
              escapedAsciiSearchPattern,
              escapedAsciiSearchPattern
          ]
        : [])
];
