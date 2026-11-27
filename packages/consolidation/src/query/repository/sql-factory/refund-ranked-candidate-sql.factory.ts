import {
    ExternalSourceEnum,
    REFUND_TIME_WINDOW_SECONDS,
    REFUND_TITLE_PREFIXES,
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { isDefined } from '@rnw-community/shared';

import { buildOriginalMinorAmountSql } from '../../../shared/utils/build-original-minor-amount-sql.util';
import { buildPrefixLikeSql } from '../../../shared/utils/build-prefix-like-sql.util';
import { buildPrivatbankSameOriginalAmountSql } from '../../../shared/utils/build-privatbank-same-original-amount-sql.util';
import { REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS } from '../../constant/refund-manual-review-time-window.constant';
import { buildConsolidationScanScopeSql } from '../../utils/build-consolidation-scan-scope-sql.util';

import type { PrivatbankRefundEntrySqlColumnsInterface } from '../../../shared/interface/privatbank-refund-entry-sql-columns.interface';
import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

const TITLE_DIGIT_SUFFIX_MIN_LENGTH = 6;
const EXTRA_UPPER_CANCEL_PREFIX = 'СКАСУВАННЯ.';

const sortPrefixesLongestFirst = (prefixes: readonly string[]): readonly string[] =>
    [...prefixes, EXTRA_UPPER_CANCEL_PREFIX].sort((left, right) => right.length - left.length);

const AUTO_TITLE_PREFIXES = sortPrefixesLongestFirst(REFUND_TITLE_PREFIXES.auto);
const REVIEW_TITLE_PREFIXES = sortPrefixesLongestFirst(REFUND_TITLE_PREFIXES.review);

const buildStripPrefixesSql = (column: string, prefixes: readonly string[]): string =>
    `CASE ${prefixes.map(prefix => `WHEN SUBSTR(${column}, 1, ${prefix.length}) = '${prefix}' THEN TRIM(SUBSTR(${column}, ${prefix.length + 1}))`).join(' ')} ELSE ${column} END`;

const buildConditionalStripSql = (previousColumn: string, priorColumn: string, prefixes: readonly string[]): string =>
    `CASE WHEN ${previousColumn} != ${priorColumn} THEN ${buildStripPrefixesSql(previousColumn, prefixes)} ELSE ${previousColumn} END`;

const buildOptionalReviewColSql = (includeReview: boolean, expressionSql: string, alias: string): string =>
    includeReview ? `, ${expressionSql} AS ${alias}` : '';

const buildStripCommaSuffixSql = (column: string): string =>
    `TRIM(CASE WHEN INSTR(${column}, ',') > 0 THEN SUBSTR(${column}, 1, INSTR(${column}, ',') - 1) ELSE ${column} END)`;

const buildDigitSuffixBaseTitleSql = (title: string): string => {
    const digitSuffixLength = `(LENGTH(${title}) - LENGTH(RTRIM(${title}, '0123456789')))`;
    const baseTitle = `TRIM(SUBSTR(${title}, 1, LENGTH(${title}) - ${digitSuffixLength}))`;

    return `CASE WHEN ${digitSuffixLength} >= ${TITLE_DIGIT_SUFFIX_MIN_LENGTH} AND SUBSTR(${title}, LENGTH(${title}) - ${digitSuffixLength}, 1) = ' ' AND ${baseTitle} != '' THEN ${baseTitle} ELSE NULL END`;
};

const AUTO_TITLE_MATCH_SQL = `(inc.autoNormTitle = exp.autoNormTitle OR (inc.autoSuffixBaseTitle IS NOT NULL AND exp.autoSuffixBaseTitle IS NULL AND inc.autoSuffixBaseTitle = exp.autoNormTitle) OR (exp.autoSuffixBaseTitle IS NOT NULL AND inc.autoSuffixBaseTitle IS NULL AND exp.autoSuffixBaseTitle = inc.autoNormTitle))`;

const buildPrivatbankRefundEntryColumns = (alias: string): PrivatbankRefundEntrySqlColumnsInterface => ({
    amount: `${alias}.amount`,
    exchangeRate: `${alias}.exchangeRate`,
    externalSource: `${alias}.externalSource`,
    operationInstrumentId: `${alias}.operationInstrumentId`
});

const buildPrivatbankRawEntryColumns = (entryAlias: string, txAlias: string): PrivatbankRefundEntrySqlColumnsInterface => ({
    amount: `${entryAlias}.amount`,
    exchangeRate: `${entryAlias}.exchange_rate`,
    externalSource: `${txAlias}.external_source`,
    operationInstrumentId: `${entryAlias}.operation_instrument_id`
});

const PRIVATBANK_SAME_ORIGINAL_AMOUNT_SQL = buildPrivatbankSameOriginalAmountSql(
    buildPrivatbankRefundEntryColumns('inc'),
    buildPrivatbankRefundEntryColumns('exp')
);

const buildWindowAndDistinctTxSql = (windowSeconds: number): string =>
    `exp.operatedAt <= inc.operatedAt AND exp.operatedAt >= inc.operatedAt - ${windowSeconds} AND exp.expenseTxId != inc.txId`;

const AUTO_WINDOW_SQL = buildWindowAndDistinctTxSql(REFUND_TIME_WINDOW_SECONDS);
const REVIEW_WINDOW_SQL = buildWindowAndDistinctTxSql(REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS);
const EXACT_TITLE_COND_SQL = `(inc.rawNormTitle = exp.rawNormTitle AND inc.rawNormTitle != '')`;
const LOCALIZED_TITLE_COND_SQL = `(${AUTO_TITLE_MATCH_SQL} AND inc.autoNormTitle != '' AND inc.rawNormTitle != exp.rawNormTitle)`;
const REJECTED_PRINCIPAL_PREFIX_SQL = buildPrefixLikeSql('rawNormTitle', REFUND_TITLE_PREFIXES.rejectedPaymentPrincipal);
const REJECTED_PRINCIPAL_COND_SQL = '(inc.isRejectedPrincipal = 1 AND inc.amount = exp.amount)';
const PRIVATBANK_CATEGORY_REFUND_PREFIX_SQL = buildPrefixLikeSql('rawNormTitle', REFUND_TITLE_PREFIXES.privatbankCategoryRefund);
const PRIVATBANK_ORIGINAL_COND_SQL = `(inc.isPrivatbankRefund = 1 AND ${PRIVATBANK_SAME_ORIGINAL_AMOUNT_SQL})`;
const REJECTED_FEE_PREFIX_SQL = buildPrefixLikeSql('rawNormTitle', REFUND_TITLE_PREFIXES.rejectedPaymentFee);
const INDIVIDUAL_FEE_MATCH_EXISTS_SQL = `EXISTS (SELECT 1 FROM transaction_entries expense_fee_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx WHERE expense_fee_entry.transaction_id = exp.expenseTxId AND expense_fee_entry.account_id = exp.accountId AND expense_fee_entry.deleted_at IS NULL AND expense_fee_entry.original_transaction_id IS NULL AND expense_fee_entry.type = '${TransactionEntryTypeEnum.FEE}' AND expense_fee_entry.amount = inc.amount)`;
const REJECTED_FEE_AMOUNT_MATCH_SQL = `(exp.feeAmount = inc.amount OR ${INDIVIDUAL_FEE_MATCH_EXISTS_SQL})`;
const REJECTED_FEE_COND_SQL = `(inc.isRejectedFee = 1 AND exp.feeAmount > 0 AND ${REJECTED_FEE_AMOUNT_MATCH_SQL})`;
const REVIEW_MCC_MATCH_SQL = '(inc.mccCategoryId = exp.mccCategoryId OR (inc.mccCategoryId IS NULL AND exp.mccCategoryId IS NULL))';

const NOT_ANY_AUTO_FOR_REVIEW_SQL = `NOT (inc.accountId = exp.accountId AND (inc.operatedAt - exp.operatedAt) <= ${REFUND_TIME_WINDOW_SECONDS} AND (COALESCE(${LOCALIZED_TITLE_COND_SQL}, 0) = 1 OR COALESCE(${REJECTED_PRINCIPAL_COND_SQL}, 0) = 1 OR COALESCE(${PRIVATBANK_ORIGINAL_COND_SQL}, 0) = 1 OR COALESCE(${REJECTED_FEE_COND_SQL}, 0) = 1))`;

const buildExcludeCondsSql = (conditions: readonly string[]): string =>
    conditions.map(condition => `AND COALESCE(${condition}, 0) = 0`).join(' ');

const buildSafeOriginalMinorAmountSql = (amount: string, exchangeRate: string): string =>
    `CASE WHEN ${exchangeRate} > 0 THEN ${buildOriginalMinorAmountSql(amount, exchangeRate)} ELSE 0 END`;

const DEFAULT_INSTRUMENT_CTE_SQL = `default_instrument AS MATERIALIZED (SELECT (SELECT default_instrument_id FROM settings WHERE deleted_at IS NULL LIMIT 1) AS defaultInstrumentId)`;

const buildIncomeBoundsCtesSql = (includeReview: boolean): string => {
    const joinWindowSeconds = includeReview ? REFUND_MANUAL_REVIEW_TIME_WINDOW_SECONDS : REFUND_TIME_WINDOW_SECONDS;
    const incomeKeyColumn = includeReview ? 'instrumentId' : 'accountId';

    return `income_bounds AS MATERIALIZED (SELECT MIN(operatedAt) - ${joinWindowSeconds} AS operatedAtFrom, MAX(operatedAt) AS operatedAtTo,
        COALESCE(MAX(CASE WHEN autoSuffixBaseTitle IS NOT NULL THEN 1 ELSE 0 END), 0) AS hasIncSuffix, COALESCE(MAX(CASE WHEN isRejectedPrincipal THEN 1 ELSE 0 END), 0) AS hasRejectedPrincipal,
        COALESCE(MAX(CASE WHEN isPrivatbankRefund THEN 1 ELSE 0 END), 0) AS hasPrivatbankRefund, COALESCE(MAX(CASE WHEN isRejectedFee THEN 1 ELSE 0 END), 0) AS hasRejectedFee FROM income_entries),
    income_keys AS MATERIALIZED (SELECT DISTINCT ${incomeKeyColumn} AS keyId FROM income_entries)`;
};

const EXPENSE_FLAGS_CTE_SQL = `expense_flags AS MATERIALIZED (SELECT COALESCE(MAX(CASE WHEN autoSuffixBaseTitle IS NOT NULL THEN 1 ELSE 0 END), 0) AS hasExpSuffix FROM expense_entries)`;

const wrapNormalizedTitleLayersSql = (cteName: string, autoNormSql: string, innerSelectSql: string, includeReview: boolean): string => {
    const pass1Sql = `SELECT *, ${buildStripPrefixesSql('rawNormTitle', AUTO_TITLE_PREFIXES)} AS autoPrefixPass1${buildOptionalReviewColSql(includeReview, buildStripPrefixesSql('rawNormTitle', REVIEW_TITLE_PREFIXES), 'reviewPrefixPass1')} FROM (${innerSelectSql} LIMIT -1) LIMIT -1`;
    const pass2Sql = `SELECT *, ${buildConditionalStripSql('autoPrefixPass1', 'rawNormTitle', AUTO_TITLE_PREFIXES)} AS autoPrefixPass2${buildOptionalReviewColSql(includeReview, buildConditionalStripSql('reviewPrefixPass1', 'rawNormTitle', REVIEW_TITLE_PREFIXES), 'reviewPrefixPass2')} FROM (${pass1Sql}) LIMIT -1`;
    const pass3Sql = `SELECT *, ${buildConditionalStripSql('autoPrefixPass2', 'autoPrefixPass1', AUTO_TITLE_PREFIXES)} AS autoPrefixStripped${buildOptionalReviewColSql(includeReview, buildConditionalStripSql('reviewPrefixPass2', 'reviewPrefixPass1', REVIEW_TITLE_PREFIXES), 'reviewNormTitle')} FROM (${pass2Sql}) LIMIT -1`;

    return `${cteName} AS MATERIALIZED (SELECT *, ${buildDigitSuffixBaseTitleSql('autoNormTitle')} AS autoSuffixBaseTitle FROM (SELECT *, ${autoNormSql} AS autoNormTitle${buildOptionalReviewColSql(includeReview, buildStripCommaSuffixSql('reviewNormTitle'), 'reviewMerchantNormTitle')} FROM (${pass3Sql}) LIMIT -1))`;
};

const EXPENSE_LIVE_FEE_WHERE_SQL = `expense_fee_entry.transaction_id = expense_tx.id AND expense_fee_entry.account_id = expense_entry.account_id AND expense_fee_entry.deleted_at IS NULL AND expense_fee_entry.original_transaction_id IS NULL AND expense_fee_entry.type = '${TransactionEntryTypeEnum.FEE}' AND expense_fee_entry.amount > 0`;
const EXPENSE_ABSORBED_FEE_WHERE_SQL = `absorbed_fee_entry.transaction_id = expense_tx.id AND absorbed_fee_entry.deleted_at IS NULL AND absorbed_fee_entry.original_transaction_id IS NOT NULL AND absorbed_fee_entry.type = '${TransactionEntryTypeEnum.DEBIT}' AND ${buildPrefixLikeSql('UPPER(TRIM(absorbed_fee_tx.title))', REFUND_TITLE_PREFIXES.rejectedPaymentFee)}`;

const buildExpenseFeeSubquerySql = (aggregateSql: string): string =>
    `SELECT ${aggregateSql} FROM transaction_entries expense_fee_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx WHERE ${EXPENSE_LIVE_FEE_WHERE_SQL}`;

const buildAbsorbedFeeSubquerySql = (aggregateSql: string): string =>
    `SELECT ${aggregateSql} FROM transaction_entries absorbed_fee_entry INDEXED BY transaction_entries_refund_tx_idx INNER JOIN transactions absorbed_fee_tx ON absorbed_fee_tx.id = absorbed_fee_entry.original_transaction_id WHERE ${EXPENSE_ABSORBED_FEE_WHERE_SQL}`;

const buildExpenseMetricsSql = (): string => `
    CASE WHEN income_bounds.hasRejectedFee = 0 AND expense_tx.consolidation_type IS NULL THEN 0 ELSE COALESCE((${buildExpenseFeeSubquerySql('SUM(expense_fee_entry.amount)')}), 0) END AS feeAmount,
    CASE WHEN income_bounds.hasRejectedFee = 0 THEN '' ELSE COALESCE((${buildExpenseFeeSubquerySql('GROUP_CONCAT(expense_fee_entry.amount)')}), '') END AS feeAmountsCsv,
    CASE WHEN expense_tx.consolidation_type IS NULL THEN 0 ELSE COALESCE((SELECT SUM(absorbed_entry.amount) FROM transaction_entries absorbed_entry INDEXED BY transaction_entries_refund_tx_idx WHERE absorbed_entry.transaction_id = expense_tx.id AND absorbed_entry.deleted_at IS NULL AND absorbed_entry.original_transaction_id IS NOT NULL AND absorbed_entry.type = '${TransactionEntryTypeEnum.DEBIT}'), 0) END AS absorbedAmount,
    CASE WHEN expense_tx.consolidation_type IS NULL THEN 0 ELSE COALESCE((${buildAbsorbedFeeSubquerySql('SUM(absorbed_fee_entry.amount)')}), 0) END AS absorbedFeeAmount,
    CASE WHEN income_bounds.hasRejectedFee = 0 OR expense_tx.consolidation_type IS NULL THEN '' ELSE COALESCE((${buildAbsorbedFeeSubquerySql('GROUP_CONCAT(absorbed_fee_entry.amount)')}), '') END AS absorbedFeeAmountsCsv,
    expense_tx.consolidation_type IS NOT NULL AND EXISTS (SELECT 1 FROM transaction_entries closing_entry INDEXED BY transaction_entries_refund_tx_idx INNER JOIN transactions closing_tx ON closing_tx.id = closing_entry.original_transaction_id WHERE closing_entry.transaction_id = expense_tx.id AND closing_entry.deleted_at IS NULL AND closing_entry.original_transaction_id IS NOT NULL AND closing_entry.type = '${TransactionEntryTypeEnum.DEBIT}' AND ${buildPrivatbankSameOriginalAmountSql(buildPrivatbankRawEntryColumns('closing_entry', 'closing_tx'), buildPrivatbankRawEntryColumns('expense_entry', 'expense_tx'))}) AS isClosed`;

const buildExpenseEntriesSql = (scope: ConsolidationScanScopeInterface | null, includeReview: boolean): string => {
    const expenseKeyColumn = includeReview ? 'expense_account.instrument_id' : 'expense_entry.account_id';

    return wrapNormalizedTitleLayersSql(
        'expense_entries',
        buildStripCommaSuffixSql('autoPrefixStripped'),
        `SELECT expense_tx.id AS expenseTxId, expense_tx.sync_id AS syncId, expense_tx.operated_at AS operatedAt,
                expense_entry.account_id AS accountId, expense_account.instrument_id AS instrumentId, expense_entry.amount AS amount,
                expense_entry.mcc_category_id AS mccCategoryId, expense_entry.exchange_rate AS exchangeRate,
                expense_tx.external_source AS externalSource, expense_entry.operation_instrument_id AS operationInstrumentId,
                ${buildSafeOriginalMinorAmountSql('expense_entry.amount', 'expense_entry.exchange_rate')} AS originalMinorAmount,
                UPPER(TRIM(expense_tx.title)) AS rawNormTitle, ${buildExpenseMetricsSql()}
            FROM income_bounds CROSS JOIN transactions expense_tx INDEXED BY transactions_visible_type_operated_idx
            INNER JOIN transaction_entries expense_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                ON expense_entry.transaction_id = expense_tx.id AND expense_entry.deleted_at IS NULL
                AND expense_entry.original_transaction_id IS NULL AND expense_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                AND expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}' AND expense_entry.amount > 0
            INNER JOIN accounts expense_account ON expense_account.id = expense_entry.account_id AND expense_account.deleted_at IS NULL AND expense_account.is_external = 0
            WHERE income_bounds.operatedAtFrom IS NOT NULL AND expense_tx.deleted_at IS NULL AND expense_tx.consolidation_parent_transaction_id IS NULL
                AND (expense_tx.consolidation_type IS NULL OR expense_tx.consolidation_type = '${TransactionConsolidationTypeEnum.REFUND}')
                AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                AND expense_tx.operated_at BETWEEN income_bounds.operatedAtFrom AND income_bounds.operatedAtTo
                AND ${expenseKeyColumn} IN (SELECT keyId FROM income_keys)
                AND NOT EXISTS (
                    SELECT 1 FROM transaction_entries expense_sibling_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                    WHERE expense_sibling_entry.transaction_id = expense_tx.id AND expense_sibling_entry.deleted_at IS NULL
                        AND expense_sibling_entry.original_transaction_id IS NULL AND expense_sibling_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                        AND expense_sibling_entry.id != expense_entry.id
                ) ${buildConsolidationScanScopeSql(scope, 'expense_tx.operated_at')}`,
        includeReview
    );
};

const buildIncomeEntriesSql = (scope: ConsolidationScanScopeInterface | null, includeReview: boolean): string =>
    wrapNormalizedTitleLayersSql(
        'income_entries',
        `CASE WHEN autoPrefixStripped != rawNormTitle THEN ${buildStripCommaSuffixSql('autoPrefixStripped')} ELSE autoPrefixStripped END`,
        `SELECT *, (${REJECTED_PRINCIPAL_PREFIX_SQL}) AS isRejectedPrincipal,
                (externalSource = '${ExternalSourceEnum.PRIVATBANK}' AND exchangeRate > 0 AND exchangeRate != 1 AND ${PRIVATBANK_CATEGORY_REFUND_PREFIX_SQL}) AS isPrivatbankRefund,
                (${REJECTED_FEE_PREFIX_SQL}) AS isRejectedFee
            FROM (SELECT income_tx.id AS txId, income_tx.sync_id AS syncId, income_tx.refund_auto_pair_disabled AS isAutoPairDisabled,
                income_tx.operated_at AS operatedAt, income_entry.account_id AS accountId, income_account.instrument_id AS instrumentId,
                income_entry.amount AS amount, income_entry.mcc_category_id AS mccCategoryId, income_entry.exchange_rate AS exchangeRate,
                income_tx.external_source AS externalSource, income_entry.operation_instrument_id AS operationInstrumentId,
                ${buildSafeOriginalMinorAmountSql('income_entry.amount', 'income_entry.exchange_rate')} AS originalMinorAmount,
                CASE WHEN income_account.instrument_id = default_instrument.defaultInstrumentId THEN income_entry.amount
                    WHEN income_entry.base_instrument_id = default_instrument.defaultInstrumentId THEN income_entry.base_amount ELSE NULL END AS baseAmount,
                EXISTS (SELECT 1 FROM transaction_tags income_tag WHERE income_tag.transaction_id = income_tx.id) AS hasTags,
                UPPER(TRIM(income_tx.title)) AS rawNormTitle
            FROM default_instrument CROSS JOIN transactions income_tx INDEXED BY transactions_visible_type_operated_idx
            INNER JOIN transaction_entries income_entry INDEXED BY transaction_entries_live_transaction_account_amount_idx
                ON income_entry.transaction_id = income_tx.id AND income_entry.deleted_at IS NULL
                AND income_entry.original_transaction_id IS NULL AND income_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                AND income_entry.type = '${TransactionEntryTypeEnum.DEBIT}' AND income_entry.amount > 0
            INNER JOIN accounts income_account ON income_account.id = income_entry.account_id AND income_account.deleted_at IS NULL AND income_account.is_external = 0
            WHERE income_tx.deleted_at IS NULL AND income_tx.consolidation_parent_transaction_id IS NULL
                AND income_tx.consolidation_type IS NULL AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                ${includeReview ? '' : 'AND income_tx.refund_auto_pair_disabled = 0'}
                AND NOT EXISTS (
                    SELECT 1 FROM transaction_entries income_sibling_entry INDEXED BY transaction_entries_transaction_idx
                    WHERE income_sibling_entry.transaction_id = income_tx.id AND income_sibling_entry.deleted_at IS NULL AND income_sibling_entry.id != income_entry.id
                ) ${buildConsolidationScanScopeSql(scope, 'income_tx.operated_at')})`,
        includeReview
    );

const buildRefundBranchSql = (
    confidenceBucket: string,
    joinConditionSql: string,
    whereConditionSql: string,
    gate?: readonly [string, string]
): string => {
    const gateFromPrefix = isDefined(gate) ? `${gate[0]} CROSS JOIN ` : '';
    const gateWherePrefix = isDefined(gate) ? `${gate[0]}.${gate[1]} = 1 AND ` : '';

    return `SELECT exp.expenseTxId AS expenseTransactionId, exp.syncId AS expenseSyncId, exp.operatedAt AS expenseOperatedAt,
        exp.autoNormTitle AS expenseAutoNormTitle, inc.autoNormTitle AS refundAutoNormTitle, exp.accountId AS accountId,
        exp.amount AS expenseAmount, exp.absorbedAmount AS expenseAbsorbedAmount, exp.absorbedFeeAmount AS expenseAbsorbedFeeAmount,
        exp.feeAmount AS feeAmount, exp.feeAmountsCsv AS feeAmountsCsv, exp.absorbedFeeAmountsCsv AS absorbedFeeAmountsCsv,
        exp.originalMinorAmount AS expenseOriginalMinorAmount, exp.isClosed AS isExpenseClosed,
        ${PRIVATBANK_SAME_ORIGINAL_AMOUNT_SQL} AS isPrivatbankOriginalMatch, inc.txId AS refundTransactionId, inc.syncId AS refundSyncId,
        inc.operatedAt AS refundOperatedAt, inc.isAutoPairDisabled AS isRefundAutoPairDisabled, inc.hasTags AS refundHasTags,
        inc.baseAmount AS refundBaseAmount, inc.amount AS refundAmount, inc.originalMinorAmount AS refundOriginalMinorAmount, '${confidenceBucket}' AS confidenceBucket
    FROM ${gateFromPrefix}income_entries inc INNER JOIN expense_entries exp ON ${joinConditionSql} WHERE ${gateWherePrefix}${whereConditionSql}`;
};

const LOCALIZED_SUFFIX_BASE_WHERE_SQL = `inc.autoNormTitle != '' AND inc.rawNormTitle != exp.rawNormTitle AND inc.autoNormTitle != exp.autoNormTitle AND ${AUTO_WINDOW_SQL}`;

const AUTO_BRANCH_SPECS: readonly (readonly [string, string, string, (readonly [string, string])?])[] = [
    [
        'AUTO_REFUND_EXACT_TITLE',
        'exp.accountId = inc.accountId AND exp.rawNormTitle = inc.rawNormTitle',
        `inc.rawNormTitle != '' AND ${AUTO_WINDOW_SQL}`
    ],
    [
        'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
        'exp.accountId = inc.accountId AND exp.autoNormTitle = inc.autoNormTitle',
        `inc.autoNormTitle != '' AND inc.rawNormTitle != exp.rawNormTitle AND ${AUTO_WINDOW_SQL}`
    ],
    [
        'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
        'exp.accountId = inc.accountId AND exp.autoNormTitle = inc.autoSuffixBaseTitle',
        `inc.autoSuffixBaseTitle IS NOT NULL AND exp.autoSuffixBaseTitle IS NULL AND ${LOCALIZED_SUFFIX_BASE_WHERE_SQL}`,
        ['income_bounds', 'hasIncSuffix']
    ],
    [
        'AUTO_REFUND_LOCALIZED_REFUND_TITLE',
        'exp.accountId = inc.accountId AND exp.autoSuffixBaseTitle = inc.autoNormTitle',
        `exp.autoSuffixBaseTitle IS NOT NULL AND inc.autoSuffixBaseTitle IS NULL AND ${LOCALIZED_SUFFIX_BASE_WHERE_SQL}`,
        ['expense_flags', 'hasExpSuffix']
    ],
    [
        'AUTO_REFUND_REJECTED_PAYMENT_PRINCIPAL_TITLE',
        'exp.accountId = inc.accountId AND exp.amount = inc.amount',
        `inc.isRejectedPrincipal = 1 AND ${AUTO_WINDOW_SQL} ${buildExcludeCondsSql([EXACT_TITLE_COND_SQL, LOCALIZED_TITLE_COND_SQL])}`,
        ['income_bounds', 'hasRejectedPrincipal']
    ],
    [
        'AUTO_REFUND_PRIVATBANK_ORIGINAL_AMOUNT',
        'exp.accountId = inc.accountId AND exp.externalSource = inc.externalSource AND exp.originalMinorAmount = inc.originalMinorAmount',
        `${PRIVATBANK_ORIGINAL_COND_SQL} AND ${AUTO_WINDOW_SQL} ${buildExcludeCondsSql([EXACT_TITLE_COND_SQL, LOCALIZED_TITLE_COND_SQL, REJECTED_PRINCIPAL_COND_SQL])}`,
        ['income_bounds', 'hasPrivatbankRefund']
    ],
    [
        'AUTO_REFUND_REJECTED_PAYMENT_FEE_TITLE',
        'exp.accountId = inc.accountId',
        `inc.isRejectedFee = 1 AND exp.feeAmount > 0 AND ${REJECTED_FEE_AMOUNT_MATCH_SQL} AND ${AUTO_WINDOW_SQL} ${buildExcludeCondsSql([EXACT_TITLE_COND_SQL, LOCALIZED_TITLE_COND_SQL, REJECTED_PRINCIPAL_COND_SQL, PRIVATBANK_ORIGINAL_COND_SQL])}`,
        ['income_bounds', 'hasRejectedFee']
    ]
];

const REVIEW_BASE_WHERE_SQL = `inc.reviewMerchantNormTitle != '' AND inc.rawNormTitle != exp.rawNormTitle AND ${REVIEW_MCC_MATCH_SQL} AND ${REVIEW_WINDOW_SQL} AND ${NOT_ANY_AUTO_FOR_REVIEW_SQL}`;

const REVIEW_BRANCH_SPECS: readonly (readonly [string, string, string, (readonly [string, string])?])[] = [
    [
        'REVIEW_REFUND_PREFIX_TITLE_MCC',
        'exp.instrumentId = inc.instrumentId AND exp.reviewNormTitle = inc.reviewNormTitle',
        REVIEW_BASE_WHERE_SQL
    ],
    [
        'REVIEW_REFUND_PREFIX_TITLE_MCC',
        'exp.instrumentId = inc.instrumentId AND exp.reviewMerchantNormTitle = inc.reviewMerchantNormTitle',
        `inc.reviewNormTitle != exp.reviewNormTitle AND ${REVIEW_BASE_WHERE_SQL}`
    ]
];

const buildCompatiblePairsSql = (includeReview: boolean): string =>
    (includeReview ? [...AUTO_BRANCH_SPECS, ...REVIEW_BRANCH_SPECS] : AUTO_BRANCH_SPECS)
        .map(([confidenceBucket, joinConditionSql, whereConditionSql, gate]) =>
            buildRefundBranchSql(confidenceBucket, joinConditionSql, whereConditionSql, gate)
        )
        .join('\n    UNION ALL\n');

export const buildRefundEdgeSql = (scope: ConsolidationScanScopeInterface | null, includeReview: boolean): string => `
    WITH ${DEFAULT_INSTRUMENT_CTE_SQL},
    ${buildIncomeEntriesSql(scope, includeReview)},
    ${buildIncomeBoundsCtesSql(includeReview)},
    ${buildExpenseEntriesSql(scope, includeReview)},
    ${EXPENSE_FLAGS_CTE_SQL}
    ${buildCompatiblePairsSql(includeReview)}
`;
