import {
    REFUND_TIME_WINDOW_SECONDS,
    REFUND_TITLE_PREFIXES,
    TransactionConsolidationTypeEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { buildOriginalMinorAmountSql } from '../../../shared/utils/build-original-minor-amount-sql.util';
import { buildPrefixLikeSql } from '../../../shared/utils/build-prefix-like-sql.util';
import { buildPrivatbankSameOriginalAmountSql } from '../../../shared/utils/build-privatbank-same-original-amount-sql.util';
import { REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS } from '../../constant/refund-manual-review-time-window.constant';
import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { PrivatbankRefundEntrySqlColumnsInterface } from '../../../shared/interface/privatbank-refund-entry-sql-columns.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const TITLE_DIGIT_SUFFIX_MIN_LENGTH = 6;

const buildStripPrefixesSql = (seedExpression: string, prefixes: readonly string[]): string =>
    `TRIM(${prefixes.reduce((acc, prefix) => `REPLACE(${acc}, '${prefix}', '')`, seedExpression)})`;

const buildStripCommaSuffixSql = (seedExpression: string): string =>
    `TRIM(CASE WHEN INSTR(${seedExpression}, ',') > 0 THEN SUBSTR(${seedExpression}, 1, INSTR(${seedExpression}, ',') - 1) ELSE ${seedExpression} END)`;

const buildDigitSuffixBaseTitleSql = (title: string): string => {
    const digitSuffixLength = `(LENGTH(${title}) - LENGTH(RTRIM(${title}, '0123456789')))`;
    const baseTitle = `TRIM(SUBSTR(${title}, 1, LENGTH(${title}) - ${digitSuffixLength}))`;

    return `CASE WHEN ${digitSuffixLength} >= ${TITLE_DIGIT_SUFFIX_MIN_LENGTH}
        AND SUBSTR(${title}, LENGTH(${title}) - ${digitSuffixLength}, 1) = ' '
        AND ${baseTitle} != '' THEN ${baseTitle} ELSE NULL END`;
};

const AUTO_TITLE_MATCH_SQL = `(inc.autoNormTitle = exp.autoNormTitle
    OR (inc.autoSuffixBaseTitle IS NOT NULL AND exp.autoSuffixBaseTitle IS NULL AND inc.autoSuffixBaseTitle = exp.autoNormTitle)
    OR (exp.autoSuffixBaseTitle IS NOT NULL AND inc.autoSuffixBaseTitle IS NULL AND exp.autoSuffixBaseTitle = inc.autoNormTitle))`;

const buildPrivatbankRefundEntryColumns = (alias: string): PrivatbankRefundEntrySqlColumnsInterface => ({
    amount: `${alias}.amount`,
    exchangeRate: `${alias}.exchangeRate`,
    externalSource: `${alias}.externalSource`,
    operationInstrumentId: `${alias}.operationInstrumentId`
});

const buildPrivatbankOriginalAmountRefundSql =
    (): string => `${buildPrefixLikeSql('inc.rawNormTitle', REFUND_TITLE_PREFIXES.privatbankCategoryRefund)}
    AND inc.accountId = exp.accountId
    AND ${buildPrivatbankSameOriginalAmountSql(buildPrivatbankRefundEntryColumns('inc'), buildPrivatbankRefundEntryColumns('exp'))}
    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}`;

const buildExpenseEntriesSql = (
    autoTitle: string,
    reviewTitle: string,
    reviewMerchantTitle: string,
    scope: ConsolidationScanScopeInterface | null
): string => `
    expense_entries AS MATERIALIZED (
        SELECT *, ${buildDigitSuffixBaseTitleSql('autoNormTitle')} AS autoSuffixBaseTitle
        FROM (
            SELECT
                expense_tx.id AS expenseTxId, expense_tx.sync_id AS syncId,
                expense_tx.operated_at AS operatedAt, expense_entry.account_id AS accountId,
                expense_account.instrument_id AS instrumentId,
                expense_entry.amount AS amount, expense_entry.mcc_category_id AS mccCategoryId,
                expense_entry.exchange_rate AS exchangeRate, expense_tx.external_source AS externalSource,
                expense_entry.operation_instrument_id AS operationInstrumentId, ${buildOriginalMinorAmountSql('expense_entry.amount', 'expense_entry.exchange_rate')} AS originalMinorAmount,
                UPPER(TRIM(expense_tx.title)) AS rawNormTitle,
                ${autoTitle} AS autoNormTitle,
                ${reviewTitle} AS reviewNormTitle,
                ${reviewMerchantTitle} AS reviewMerchantNormTitle,
                (
                    SELECT expense_fee_entry.amount
                    FROM transaction_entries expense_fee_entry
                    WHERE expense_fee_entry.transaction_id = expense_tx.id
                        AND expense_fee_entry.account_id = expense_entry.account_id
                        AND expense_fee_entry.deleted_at IS NULL
                        AND expense_fee_entry.original_transaction_id IS NULL
                        AND expense_fee_entry.type = '${TransactionEntryTypeEnum.FEE}'
                        AND expense_fee_entry.amount > 0
                    ORDER BY expense_fee_entry.id
                    LIMIT 1
                ) AS feeAmount,
                CASE WHEN expense_tx.consolidation_type IS NULL THEN 0 ELSE COALESCE((
                    SELECT SUM(absorbed_entry.amount)
                    FROM transaction_entries absorbed_entry
                    WHERE absorbed_entry.transaction_id = expense_tx.id
                        AND absorbed_entry.account_id = expense_entry.account_id
                        AND absorbed_entry.deleted_at IS NULL
                        AND absorbed_entry.original_transaction_id IS NOT NULL
                        AND absorbed_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                ), 0) END AS absorbedAmount
            FROM transactions expense_tx INDEXED BY transactions_visible_type_operated_idx
            INNER JOIN transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                ON expense_entry.transaction_id = expense_tx.id
                AND expense_entry.deleted_at IS NULL
                AND expense_entry.original_transaction_id IS NULL
                AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                AND expense_entry.amount > 0
            INNER JOIN accounts expense_account ON expense_account.id = expense_entry.account_id
            WHERE expense_tx.deleted_at IS NULL
                AND expense_tx.consolidation_parent_transaction_id IS NULL
                AND (expense_tx.consolidation_type IS NULL OR expense_tx.consolidation_type = '${TransactionConsolidationTypeEnum.REFUND}')
                AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                ${buildConsolidationScanScopeSql(scope, 'expense_tx.operated_at')}
        )
    )
`;

const buildIncomeEntriesSql = (
    autoTitle: string,
    reviewTitle: string,
    reviewMerchantTitle: string,
    scope: ConsolidationScanScopeInterface | null
): string => `
    income_entries AS MATERIALIZED (
        SELECT *, ${buildDigitSuffixBaseTitleSql('autoNormTitle')} AS autoSuffixBaseTitle
        FROM (
            SELECT
                income_tx.id AS txId, income_tx.sync_id AS syncId,
                income_tx.refund_auto_pair_disabled AS isAutoPairDisabled,
                income_tx.operated_at AS operatedAt, income_entry.account_id AS accountId,
                income_account.instrument_id AS instrumentId,
                income_entry.amount AS amount, income_entry.mcc_category_id AS mccCategoryId,
                income_entry.exchange_rate AS exchangeRate, income_tx.external_source AS externalSource,
                income_entry.operation_instrument_id AS operationInstrumentId, ${buildOriginalMinorAmountSql('income_entry.amount', 'income_entry.exchange_rate')} AS originalMinorAmount,
                CASE
                    WHEN income_account.instrument_id = (SELECT default_instrument_id FROM settings LIMIT 1) THEN income_entry.amount
                    WHEN income_entry.base_instrument_id = (SELECT default_instrument_id FROM settings LIMIT 1) THEN income_entry.base_amount
                    ELSE NULL
                END AS baseAmount,
                EXISTS (SELECT 1 FROM transaction_tags income_tag WHERE income_tag.transaction_id = income_tx.id) AS hasTags,
                UPPER(TRIM(income_tx.title)) AS rawNormTitle,
                ${autoTitle} AS autoNormTitle,
                ${reviewTitle} AS reviewNormTitle,
                ${reviewMerchantTitle} AS reviewMerchantNormTitle
            FROM transactions income_tx INDEXED BY transactions_visible_type_operated_idx
            INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                ON income_entry.transaction_id = income_tx.id
                AND income_entry.deleted_at IS NULL
                AND income_entry.original_transaction_id IS NULL
                AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                AND income_entry.amount > 0
            INNER JOIN accounts income_account ON income_account.id = income_entry.account_id
            WHERE income_tx.deleted_at IS NULL
                AND income_tx.consolidation_parent_transaction_id IS NULL
                AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                ${buildConsolidationScanScopeSql(scope, 'income_tx.operated_at')}
        )
    )
`;

const buildCompatiblePairsSql = (): string => `
    compatible_pairs AS (
        SELECT
            exp.expenseTxId AS expenseTransactionId, exp.syncId AS expenseSyncId,
            exp.operatedAt AS expenseOperatedAt, exp.autoNormTitle AS expenseAutoNormTitle, inc.autoNormTitle AS refundAutoNormTitle,
            exp.accountId AS accountId,
            exp.amount AS expenseAmount, exp.absorbedAmount AS expenseAbsorbedAmount,
            exp.feeAmount AS feeAmount, exp.originalMinorAmount AS expenseOriginalMinorAmount,
            inc.txId AS refundTransactionId, inc.syncId AS refundSyncId,
            inc.operatedAt AS refundOperatedAt, inc.isAutoPairDisabled AS isRefundAutoPairDisabled,
            inc.hasTags AS refundHasTags, inc.baseAmount AS refundBaseAmount,
            inc.amount AS refundAmount, inc.originalMinorAmount AS refundOriginalMinorAmount,
            CASE
                WHEN inc.rawNormTitle = exp.rawNormTitle AND inc.accountId = exp.accountId
                    AND inc.rawNormTitle != ''
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
                THEN 'AUTO_REFUND_EXACT_TITLE'
                WHEN ${AUTO_TITLE_MATCH_SQL} AND inc.accountId = exp.accountId
                    AND inc.autoNormTitle != ''
                    AND inc.rawNormTitle != exp.rawNormTitle
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
                THEN 'AUTO_REFUND_LOCALIZED_REFUND_TITLE'
                WHEN ${buildPrefixLikeSql('inc.rawNormTitle', REFUND_TITLE_PREFIXES.rejectedPaymentPrincipal)} AND inc.accountId = exp.accountId
                    AND inc.amount = exp.amount
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
                THEN 'AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE'
                WHEN ${buildPrefixLikeSql('inc.rawNormTitle', REFUND_TITLE_PREFIXES.rejectedPaymentFee)} AND inc.accountId = exp.accountId
                    AND exp.feeAmount IS NOT NULL AND inc.amount = exp.feeAmount
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS}
                THEN 'AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE'
                WHEN ${buildPrivatbankOriginalAmountRefundSql()}
                THEN 'AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT'
                WHEN (inc.reviewNormTitle = exp.reviewNormTitle OR inc.reviewMerchantNormTitle = exp.reviewMerchantNormTitle)
                    AND inc.reviewMerchantNormTitle != ''
                    AND (inc.mccCategoryId = exp.mccCategoryId OR (inc.mccCategoryId IS NULL AND exp.mccCategoryId IS NULL))
                    AND inc.rawNormTitle != exp.rawNormTitle
                    AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS}
                THEN 'REVIEW_REFUND_PREFIX_TITLE_MCC'
                ELSE NULL
            END AS confidenceBucket,
            CASE
                WHEN inc.rawNormTitle = exp.rawNormTitle THEN 'exact-title'
                WHEN ${AUTO_TITLE_MATCH_SQL} THEN 'localized-refund-title'
                WHEN ${buildPrefixLikeSql('inc.rawNormTitle', REFUND_TITLE_PREFIXES.rejectedPaymentPrincipal)} THEN 'rejected-payment-principal-title'
                WHEN ${buildPrefixLikeSql('inc.rawNormTitle', REFUND_TITLE_PREFIXES.rejectedPaymentFee)} THEN 'rejected-payment-fee-title'
                WHEN ${buildPrivatbankOriginalAmountRefundSql()} THEN 'privatbank-original-amount'
                ELSE 'prefix-title-mcc'
            END AS matchType
        FROM income_entries inc
        INNER JOIN expense_entries exp
            ON exp.instrumentId = inc.instrumentId
            AND exp.operatedAt <= inc.operatedAt
            AND exp.expenseTxId != inc.txId
            AND exp.operatedAt >= inc.operatedAt - ${REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS}
    )
`;

export const buildRefundEdgeSql = (scope: ConsolidationScanScopeInterface | null): string => {
    const expenseAutoTitle = buildStripCommaSuffixSql(buildStripPrefixesSql('UPPER(TRIM(expense_tx.title))', REFUND_TITLE_PREFIXES.auto));
    const incomePrefixStrippedAutoTitle = buildStripPrefixesSql('UPPER(TRIM(income_tx.title))', REFUND_TITLE_PREFIXES.auto);
    const incomeAutoTitle = `CASE WHEN ${buildPrefixLikeSql('UPPER(TRIM(income_tx.title))', REFUND_TITLE_PREFIXES.auto)}
        THEN ${buildStripCommaSuffixSql(incomePrefixStrippedAutoTitle)} ELSE ${incomePrefixStrippedAutoTitle} END`;
    const expenseReviewTitle = buildStripPrefixesSql('UPPER(TRIM(expense_tx.title))', REFUND_TITLE_PREFIXES.review);
    const incomeReviewTitle = buildStripPrefixesSql('UPPER(TRIM(income_tx.title))', REFUND_TITLE_PREFIXES.review);

    return `
        WITH ${buildExpenseEntriesSql(expenseAutoTitle, expenseReviewTitle, buildStripCommaSuffixSql(expenseReviewTitle), scope)},
        ${buildIncomeEntriesSql(incomeAutoTitle, incomeReviewTitle, buildStripCommaSuffixSql(incomeReviewTitle), scope)},
        ${buildCompatiblePairsSql()}
        SELECT * FROM compatible_pairs WHERE confidenceBucket IS NOT NULL
    `;
};
