/* eslint-disable max-lines, max-lines-per-function -- File owns a single multi-stage SQL/CTE pipeline that must stay together */
import { Log } from '@budgie/logger';

import { getErrorMessage } from '@rnw-community/shared';

import { TRANSFER_MCC_GROUP_ID } from '../constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../constant/transfer-pair-fast-time-window.constant';
import { TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE } from '../constant/transfer-pair-implied-rate-tolerance.constant';
import { TRANSFER_PAIR_TIME_WINDOW_SECONDS } from '../constant/transfer-pair-time-window.constant';
import { TransactionTypeEnum } from '../enum/transaction-type.enum';

import type { DB } from '../../@generic/type/db.type';
import type { AtmCashWithdrawalCandidateInterface } from '../interface/atm-cash-withdrawal-candidate.interface';
import type { AtmCashWithdrawalReviewCandidateInterface } from '../interface/atm-cash-withdrawal-review-candidate.interface';
import type { IbanBridgeChainTransferCandidateInterface } from '../interface/iban-bridge-chain-transfer-candidate.interface';
import type { IbanBridgeTransferCandidateInterface } from '../interface/iban-bridge-transfer-candidate.interface';
import type { TransferPairCandidateInterface } from '../interface/transfer-pair-candidate.interface';
import type { TransferPairReviewCandidateInterface } from '../interface/transfer-pair-review-candidate.interface';

export class TransferPairRepository {
    constructor(private db: DB) {}

    @Log(
        'enter',
        result =>
            `done buckets=${result.map(candidate => candidate.confidenceBucket).join(',')} matchTypes=${result.map(candidate => candidate.matchType).join(',')} expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findCandidates(): Promise<TransferPairCandidateInterface[]> {
        const sql = `
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
            FROM (${this.buildRankedCandidateSql()})
            WHERE expenseRank = 1
                AND incomeRank = 1
                AND confidenceBucket IN ('AUTO_IBAN_AMOUNT', 'AUTO_SAME_CURRENCY_AMOUNT', 'AUTO_CROSS_CURRENCY_OPERATION', 'AUTO_CROSS_CURRENCY_IMPLIED_RATE')
        `;

        return this.db.$client.getAllAsync<TransferPairCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done buckets=${result.map(candidate => candidate.confidenceBucket).join(',')} expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')} timeDiffs=${result.map(candidate => candidate.timeDiff).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findManualReviewCandidates(): Promise<TransferPairReviewCandidateInterface[]> {
        const sql = `
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
            FROM (${this.buildRankedCandidateSql()})
            WHERE expenseRank = 1
                AND incomeRank = 1
                AND confidenceBucket IN ('REVIEW_CROSS_CURRENCY_OPERATION')
        `;

        return this.db.$client.getAllAsync<TransferPairReviewCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')} targetCashAccountIds=${result.map(candidate => candidate.targetCashAccountId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findAtmCashWithdrawalCandidates(): Promise<AtmCashWithdrawalCandidateInterface[]> {
        const sql = `
            WITH active_cash_accounts AS (
                SELECT
                    cash_account.id,
                    cash_account.title,
                    cash_account.instrument_id
                FROM accounts cash_account
                WHERE cash_account.deleted_at IS NULL
                    AND cash_account.is_active = 1
                    AND cash_account.type = 'CASH'
            ),
            cash_account_counts AS (
                SELECT
                    instrument_id,
                    COUNT(*) as cashAccountCount
                FROM active_cash_accounts
                GROUP BY instrument_id
            )
            SELECT
                'AUTO_ATM_CASH_WITHDRAWAL' as confidenceBucket,
                expense_tx.id as transactionId,
                expense_tx.title as transactionTitle,
                expense_tx.comment as transactionComment,
                expense_tx.operated_at as operatedAt,
                expense_entry.id as entryId,
                source_account.id as sourceAccountId,
                source_account.title as sourceAccountTitle,
                target_cash_account.id as targetCashAccountId,
                target_cash_account.title as targetCashAccountTitle,
                source_instrument.code as currency,
                expense_entry.amount as amount
            FROM transaction_entries expense_entry
            INNER JOIN transactions expense_tx ON
                expense_entry.transaction_id = expense_tx.id
                AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                AND expense_tx.deleted_at IS NULL
                AND expense_tx.consolidation_parent_transaction_id IS NULL
            INNER JOIN accounts source_account ON
                source_account.id = expense_entry.account_id
                AND source_account.deleted_at IS NULL
                AND source_account.type != 'CASH'
            INNER JOIN instruments source_instrument ON source_instrument.id = source_account.instrument_id
            INNER JOIN mcc_categories expense_mcc ON
                expense_mcc.id = expense_entry.mcc_category_id
                AND expense_mcc.mcc = '6011'
            INNER JOIN cash_account_counts ON
                cash_account_counts.instrument_id = source_account.instrument_id
                AND cash_account_counts.cashAccountCount = 1
            INNER JOIN active_cash_accounts target_cash_account ON
                target_cash_account.instrument_id = source_account.instrument_id
            WHERE expense_entry.deleted_at IS NULL
                AND expense_entry.original_transaction_id IS NULL
        `;

        return this.db.$client.getAllAsync<AtmCashWithdrawalCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done transactionIds=${result.map(candidate => candidate.transactionId).join(',')} cashAccountCounts=${result.map(candidate => candidate.cashAccountCount).join(',')} cashAccountIds=${result.map(candidate => candidate.cashAccountIds ?? '').join('|')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findAtmCashWithdrawalReviewCandidates(): Promise<AtmCashWithdrawalReviewCandidateInterface[]> {
        const sql = `
            WITH active_cash_accounts AS (
                SELECT
                    cash_account.id,
                    cash_account.instrument_id
                FROM accounts cash_account
                WHERE cash_account.deleted_at IS NULL
                    AND cash_account.is_active = 1
                    AND cash_account.type = 'CASH'
            ),
            cash_account_counts AS (
                SELECT
                    instrument_id,
                    COUNT(*) as cashAccountCount,
                    GROUP_CONCAT(id) as cashAccountIds
                FROM active_cash_accounts
                GROUP BY instrument_id
            )
            SELECT
                'REVIEW_ATM_CASH_WITHDRAWAL' as confidenceBucket,
                expense_tx.id as transactionId,
                expense_tx.title as transactionTitle,
                source_account.id as sourceAccountId,
                source_account.title as sourceAccountTitle,
                source_instrument.code as currency,
                expense_entry.amount as amount,
                COALESCE(cash_account_counts.cashAccountCount, 0) as cashAccountCount,
                cash_account_counts.cashAccountIds as cashAccountIds
            FROM transaction_entries expense_entry
            INNER JOIN transactions expense_tx ON
                expense_entry.transaction_id = expense_tx.id
                AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                AND expense_tx.deleted_at IS NULL
                AND expense_tx.consolidation_parent_transaction_id IS NULL
            INNER JOIN accounts source_account ON
                source_account.id = expense_entry.account_id
                AND source_account.deleted_at IS NULL
                AND source_account.type != 'CASH'
            INNER JOIN instruments source_instrument ON source_instrument.id = source_account.instrument_id
            INNER JOIN mcc_categories expense_mcc ON
                expense_mcc.id = expense_entry.mcc_category_id
                AND expense_mcc.mcc = '6011'
            LEFT JOIN cash_account_counts ON cash_account_counts.instrument_id = source_account.instrument_id
            WHERE expense_entry.deleted_at IS NULL
                AND expense_entry.original_transaction_id IS NULL
                AND COALESCE(cash_account_counts.cashAccountCount, 0) != 1
        `;

        return this.db.$client.getAllAsync<AtmCashWithdrawalReviewCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done expenseTransactionIds=${result.map(candidate => candidate.expenseTransactionId).join(',')} incomeTransactionIds=${result.map(candidate => candidate.incomeTransactionId).join(',')} sourceAccountIds=${result.map(candidate => candidate.sourceAccountId).join(',')} targetAccountIds=${result.map(candidate => candidate.targetAccountId).join(',')} existingDirectTransferIds=${result.map(candidate => candidate.existingDirectTransferId ?? '').join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findIbanBridgeTransferCandidates(): Promise<IbanBridgeTransferCandidateInterface[]> {
        const sql = `
            WITH bridge_candidates AS (
                SELECT
                    expense_tx.id as expenseTransactionId,
                    expense_tx.title as expenseTransactionTitle,
                    expense_tx.comment as expenseTransactionComment,
                    expense_tx.operated_at as operatedAt,
                    expense_entry.id as expenseEntryId,
                    expense_entry.to_iban as expenseEntryToIban,
                    income_tx.id as incomeTransactionId,
                    income_tx.title as incomeTransactionTitle,
                    income_entry.id as incomeEntryId,
                    income_entry.to_iban as incomeEntryToIban,
                    bridge_account.id as bridgeAccountId,
                    bridge_account.title as bridgeAccountTitle,
                    expense_entry.amount as bridgeAmount,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    ROUND(income_entry.amount / income_entry.exchange_rate) as sourceAmount,
                    ABS(income_tx.operated_at - expense_tx.operated_at) as timeDiff
                FROM transaction_entries expense_entry
                INNER JOIN transactions expense_tx ON
                    expense_entry.transaction_id = expense_tx.id
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = expense_entry.account_id
                    AND bridge_account.deleted_at IS NULL
                INNER JOIN transactions income_tx ON
                    income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(income_tx.operated_at - expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries income_entry ON
                    income_entry.transaction_id = income_tx.id
                    AND income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
                    AND income_entry.account_id = expense_entry.account_id
                    AND income_entry.amount = expense_entry.amount
                    AND income_entry.exchange_rate > 0
                INNER JOIN accounts source_account ON
                    source_account.iban = income_entry.to_iban
                    AND source_account.deleted_at IS NULL
                INNER JOIN accounts target_account ON
                    target_account.iban = expense_entry.to_iban
                    AND target_account.deleted_at IS NULL
                LEFT JOIN mcc_categories expense_mcc ON expense_mcc.id = expense_entry.mcc_category_id
                LEFT JOIN mcc_categories income_mcc ON income_mcc.id = income_entry.mcc_category_id
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.exchange_rate > 0
                    AND expense_entry.amount > 0
                    AND expense_entry.to_iban IS NOT NULL
                    AND expense_entry.to_iban != ''
                    AND income_entry.to_iban IS NOT NULL
                    AND income_entry.to_iban != ''
                    AND source_account.id != bridge_account.id
                    AND target_account.id != bridge_account.id
                    AND source_account.id != target_account.id
                    AND (
                        expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                    )
            )
            SELECT
                'AUTO_IBAN_BRIDGE_TRANSFER' as confidenceBucket,
                expenseTransactionId,
                expenseTransactionTitle,
                expenseTransactionComment,
                operatedAt,
                expenseEntryId,
                expenseEntryToIban,
                incomeTransactionId,
                incomeTransactionTitle,
                incomeEntryId,
                incomeEntryToIban,
                bridgeAccountId,
                bridgeAccountTitle,
                bridgeAmount,
                sourceAccountId,
                sourceAccountTitle,
                sourceAmount,
                targetAccountId,
                targetAccountTitle,
                sourceAmount * 1.0 / bridgeAmount as exchangeRate,
                (
                    SELECT direct_tx.id
                    FROM transactions direct_tx
                    WHERE direct_tx.type = '${TransactionTypeEnum.TRANSFER}'
                        AND direct_tx.deleted_at IS NULL
                        AND direct_tx.consolidation_parent_transaction_id IS NULL
                        AND direct_tx.from_account_id = bridge_candidates.sourceAccountId
                        AND direct_tx.to_account_id = bridge_candidates.targetAccountId
                        AND ABS(direct_tx.operated_at - bridge_candidates.operatedAt) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND EXISTS (
                            SELECT 1
                            FROM transaction_entries direct_source_entry
                            WHERE direct_source_entry.transaction_id = direct_tx.id
                                AND direct_source_entry.deleted_at IS NULL
                                AND direct_source_entry.original_transaction_id IS NULL
                                AND direct_source_entry.account_id = bridge_candidates.sourceAccountId
                                AND direct_source_entry.amount = bridge_candidates.sourceAmount
                        )
                        AND EXISTS (
                            SELECT 1
                            FROM transaction_entries direct_target_entry
                            WHERE direct_target_entry.transaction_id = direct_tx.id
                                AND direct_target_entry.deleted_at IS NULL
                                AND direct_target_entry.original_transaction_id IS NULL
                                AND direct_target_entry.account_id = bridge_candidates.targetAccountId
                                AND direct_target_entry.amount = bridge_candidates.bridgeAmount
                        )
                    LIMIT 1
                ) as existingDirectTransferId,
                timeDiff
            FROM bridge_candidates
        `;

        return this.db.$client.getAllAsync<IbanBridgeTransferCandidateInterface>(sql);
    }

    @Log(
        'enter',
        result =>
            `done sourceExpenseTransactionIds=${result.map(candidate => candidate.sourceExpenseTransactionId).join(',')} bridgeIncomeTransactionIds=${result.map(candidate => candidate.bridgeIncomeTransactionId).join(',')} bridgeExpenseTransactionIds=${result.map(candidate => candidate.bridgeExpenseTransactionId).join(',')} targetIncomeTransactionIds=${result.map(candidate => candidate.targetIncomeTransactionId).join(',')}`,
        error => `throw error=${getErrorMessage(error)}`
    )
    async findIbanBridgeChainTransferCandidates(): Promise<IbanBridgeChainTransferCandidateInterface[]> {
        const sql = `
            SELECT
                'AUTO_IBAN_BRIDGE_CHAIN_TRANSFER' as confidenceBucket,
                sourceExpenseTransactionId,
                sourceExpenseTransactionTitle,
                sourceExpenseTransactionComment,
                sourceExpenseEntryId,
                sourceExpenseEntryToIban,
                bridgeIncomeTransactionId,
                bridgeIncomeTransactionTitle,
                bridgeIncomeEntryId,
                bridgeExpenseTransactionId,
                bridgeExpenseTransactionTitle,
                bridgeExpenseEntryId,
                targetIncomeTransactionId,
                targetIncomeTransactionTitle,
                targetIncomeEntryId,
                operatedAt,
                sourceAccountId,
                sourceAccountTitle,
                bridgeAccountId,
                bridgeAccountTitle,
                targetAccountId,
                targetAccountTitle,
                sourceAmount,
                bridgeAmount,
                targetAmount,
                sourceAmount * 1.0 / targetAmount as exchangeRate,
                timeDiff
            FROM (
                SELECT
                    source_expense_tx.id as sourceExpenseTransactionId,
                    source_expense_tx.title as sourceExpenseTransactionTitle,
                    source_expense_tx.comment as sourceExpenseTransactionComment,
                    source_expense_entry.id as sourceExpenseEntryId,
                    source_expense_entry.to_iban as sourceExpenseEntryToIban,
                    bridge_income_tx.id as bridgeIncomeTransactionId,
                    bridge_income_tx.title as bridgeIncomeTransactionTitle,
                    bridge_income_entry.id as bridgeIncomeEntryId,
                    bridge_expense_tx.id as bridgeExpenseTransactionId,
                    bridge_expense_tx.title as bridgeExpenseTransactionTitle,
                    bridge_expense_entry.id as bridgeExpenseEntryId,
                    target_income_tx.id as targetIncomeTransactionId,
                    target_income_tx.title as targetIncomeTransactionTitle,
                    target_income_entry.id as targetIncomeEntryId,
                    source_expense_tx.operated_at as operatedAt,
                    source_account.id as sourceAccountId,
                    source_account.title as sourceAccountTitle,
                    bridge_account.id as bridgeAccountId,
                    bridge_account.title as bridgeAccountTitle,
                    target_account.id as targetAccountId,
                    target_account.title as targetAccountTitle,
                    source_expense_entry.amount as sourceAmount,
                    bridge_income_entry.amount as bridgeAmount,
                    target_income_entry.amount as targetAmount,
                    MAX(
                        ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                        ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                        ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                    ) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY source_expense_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            bridge_income_tx.id,
                            bridge_expense_tx.id,
                            target_income_tx.id
                    ) as sourceExpenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_income_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_expense_tx.id,
                            target_income_tx.id
                    ) as bridgeIncomeRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_expense_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_income_tx.id,
                            target_income_tx.id
                    ) as bridgeExpenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY target_income_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at),
                                ABS(target_income_tx.operated_at - source_expense_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_income_tx.id,
                            bridge_expense_tx.id
                    ) as targetIncomeRank
                FROM transaction_entries source_expense_entry
                INNER JOIN transactions source_expense_tx ON
                    source_expense_entry.transaction_id = source_expense_tx.id
                    AND source_expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND source_expense_tx.deleted_at IS NULL
                    AND source_expense_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts source_account ON
                    source_account.id = source_expense_entry.account_id
                    AND source_account.deleted_at IS NULL
                    AND source_account.iban IS NOT NULL
                    AND source_account.iban != ''
                INNER JOIN transactions bridge_income_tx ON
                    bridge_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND bridge_income_tx.deleted_at IS NULL
                    AND bridge_income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries bridge_income_entry ON
                    bridge_income_entry.transaction_id = bridge_income_tx.id
                    AND bridge_income_entry.deleted_at IS NULL
                    AND bridge_income_entry.original_transaction_id IS NULL
                    AND bridge_income_entry.exchange_rate > 0
                    AND bridge_income_entry.amount > 0
                    AND bridge_income_entry.to_iban = source_account.iban
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = bridge_income_entry.account_id
                    AND bridge_account.deleted_at IS NULL
                INNER JOIN transactions bridge_expense_tx ON
                    bridge_expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND bridge_expense_tx.deleted_at IS NULL
                    AND bridge_expense_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(bridge_expense_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries bridge_expense_entry ON
                    bridge_expense_entry.transaction_id = bridge_expense_tx.id
                    AND bridge_expense_entry.deleted_at IS NULL
                    AND bridge_expense_entry.original_transaction_id IS NULL
                    AND bridge_expense_entry.account_id = bridge_account.id
                    AND bridge_expense_entry.amount = bridge_income_entry.amount
                    AND bridge_expense_entry.exchange_rate > 0
                    AND bridge_expense_entry.to_iban IS NOT NULL
                    AND bridge_expense_entry.to_iban != ''
                INNER JOIN transactions target_income_tx ON
                    target_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND target_income_tx.deleted_at IS NULL
                    AND target_income_tx.consolidation_parent_transaction_id IS NULL
                    AND ABS(target_income_tx.operated_at - source_expense_tx.operated_at) <= ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                INNER JOIN transaction_entries target_income_entry ON
                    target_income_entry.transaction_id = target_income_tx.id
                    AND target_income_entry.deleted_at IS NULL
                    AND target_income_entry.original_transaction_id IS NULL
                    AND target_income_entry.amount = bridge_expense_entry.amount
                    AND target_income_entry.exchange_rate > 0
                INNER JOIN accounts target_account ON
                    target_account.id = target_income_entry.account_id
                    AND target_account.deleted_at IS NULL
                    AND target_account.iban = bridge_expense_entry.to_iban
                    AND target_account.iban = source_expense_entry.to_iban
                LEFT JOIN mcc_categories source_expense_mcc ON source_expense_mcc.id = source_expense_entry.mcc_category_id
                LEFT JOIN mcc_categories bridge_income_mcc ON bridge_income_mcc.id = bridge_income_entry.mcc_category_id
                LEFT JOIN mcc_categories bridge_expense_mcc ON bridge_expense_mcc.id = bridge_expense_entry.mcc_category_id
                LEFT JOIN mcc_categories target_income_mcc ON target_income_mcc.id = target_income_entry.mcc_category_id
                WHERE source_expense_entry.deleted_at IS NULL
                    AND source_expense_entry.original_transaction_id IS NULL
                    AND source_expense_entry.exchange_rate > 0
                    AND source_expense_entry.amount > 0
                    AND source_expense_entry.to_iban IS NOT NULL
                    AND source_expense_entry.to_iban != ''
                    AND source_account.id != bridge_account.id
                    AND bridge_account.id != target_account.id
                    AND source_account.id != target_account.id
                    AND ABS(source_expense_entry.amount - (bridge_income_entry.amount / bridge_income_entry.exchange_rate)) / source_expense_entry.amount <= 0.01
                    AND (
                        source_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR bridge_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR bridge_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                        OR target_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID}
                    )
                    AND (source_expense_mcc.mcc_group_id IS NULL OR source_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (bridge_income_mcc.mcc_group_id IS NULL OR bridge_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (bridge_expense_mcc.mcc_group_id IS NULL OR bridge_expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (target_income_mcc.mcc_group_id IS NULL OR target_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
            )
            WHERE sourceExpenseRank = 1
                AND bridgeIncomeRank = 1
                AND bridgeExpenseRank = 1
                AND targetIncomeRank = 1
        `;

        return this.db.$client.getAllAsync<IbanBridgeChainTransferCandidateInterface>(sql);
    }

    private buildRankedCandidateSql(): string {
        return `
            WITH expense_entries AS (
                SELECT
                    expense_entry.id as expenseEntryId,
                    expense_entry.transaction_id as expenseTransactionId,
                    expense_entry.account_id as expenseAccountId,
                    expense_entry.amount as expenseEntryAmount,
                    expense_entry.exchange_rate as expenseEntryExchangeRate,
                    expense_entry.amount * 1.0 / expense_entry.exchange_rate as expenseOperationAmount,
                    expense_entry.to_iban as expenseEntryToIban,
                    expense_tx.title as expenseTransactionTitle,
                    expense_tx.comment as expenseTransactionComment,
                    expense_tx.operated_at as expenseOperatedAt,
                    expense_account.title as expenseAccountTitle,
                    expense_account.instrument_id as expenseInstrumentId,
                    expense_account.external_source as expenseExternalSource,
                    expense_instrument.code as expenseCurrency,
                    expense_mcc.mcc_group_id as expenseMccGroupId
                FROM transaction_entries expense_entry
                INNER JOIN transactions expense_tx ON
                    expense_entry.transaction_id = expense_tx.id
                    AND expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND expense_tx.deleted_at IS NULL
                    AND expense_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts expense_account ON
                    expense_entry.account_id = expense_account.id
                    AND expense_account.deleted_at IS NULL
                INNER JOIN instruments expense_instrument ON expense_account.instrument_id = expense_instrument.id
                LEFT JOIN mcc_categories expense_mcc ON expense_entry.mcc_category_id = expense_mcc.id
                WHERE expense_entry.deleted_at IS NULL
                    AND expense_entry.original_transaction_id IS NULL
                    AND expense_entry.exchange_rate > 0
            ),
            income_entries AS (
                SELECT
                    income_entry.id as incomeEntryId,
                    income_entry.transaction_id as incomeTransactionId,
                    income_entry.account_id as incomeAccountId,
                    income_entry.amount as incomeEntryAmount,
                    income_entry.exchange_rate as incomeEntryExchangeRate,
                    income_entry.amount / income_entry.exchange_rate as incomeOperationAmount,
                    income_entry.to_iban as incomeEntryToIban,
                    income_tx.title as incomeTransactionTitle,
                    income_tx.operated_at as incomeOperatedAt,
                    income_account.title as incomeAccountTitle,
                    income_account.instrument_id as incomeInstrumentId,
                    income_account.external_source as incomeExternalSource,
                    income_instrument.code as incomeCurrency,
                    income_mcc.mcc_group_id as incomeMccGroupId
                FROM transaction_entries income_entry
                INNER JOIN transactions income_tx ON
                    income_entry.transaction_id = income_tx.id
                    AND income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND income_tx.deleted_at IS NULL
                    AND income_tx.consolidation_parent_transaction_id IS NULL
                INNER JOIN accounts income_account ON
                    income_entry.account_id = income_account.id
                    AND income_account.deleted_at IS NULL
                INNER JOIN instruments income_instrument ON income_account.instrument_id = income_instrument.id
                LEFT JOIN mcc_categories income_mcc ON income_entry.mcc_category_id = income_mcc.id
                WHERE income_entry.deleted_at IS NULL
                    AND income_entry.original_transaction_id IS NULL
            ),
            latest_exchange_rates AS (
                SELECT
                    base_instrument_id,
                    quote_instrument_id,
                    rate * 1.0 as rate,
                    ROW_NUMBER() OVER (
                        PARTITION BY base_instrument_id, quote_instrument_id
                        ORDER BY created_at DESC
                    ) as exchangeRateRank
                FROM exchange_rates
                WHERE deleted_at IS NULL
                    AND rate > 0
            ),
            available_exchange_rates AS (
                SELECT base_instrument_id, quote_instrument_id, rate
                FROM (
                    SELECT
                        base_instrument_id,
                        quote_instrument_id,
                        rate,
                        ROW_NUMBER() OVER (
                            PARTITION BY base_instrument_id, quote_instrument_id
                            ORDER BY direction
                        ) as directionRank
                    FROM (
                        SELECT
                            base_instrument_id,
                            quote_instrument_id,
                            rate,
                            0 as direction
                        FROM latest_exchange_rates
                        WHERE exchangeRateRank = 1
                        UNION ALL
                        SELECT
                            quote_instrument_id as base_instrument_id,
                            base_instrument_id as quote_instrument_id,
                            1.0 / rate as rate,
                            1 as direction
                        FROM latest_exchange_rates
                        WHERE exchangeRateRank = 1
                    )
                )
                WHERE directionRank = 1
            ),
            scored_pairs_base AS (
                SELECT
                    expense_entries.*,
                    income_entries.*,
                    ABS(income_entries.incomeOperatedAt - expense_entries.expenseOperatedAt) as timeDiff,
                    CASE
                        WHEN expense_entries.expenseEntryAmount > 0
                        THEN income_entries.incomeEntryAmount * 1.0 / expense_entries.expenseEntryAmount
                        ELSE NULL
                    END as impliedExchangeRate,
                    (
                        SELECT rate FROM available_exchange_rates
                        WHERE base_instrument_id = expense_entries.expenseInstrumentId
                            AND quote_instrument_id = income_entries.incomeInstrumentId
                        LIMIT 1
                    ) as expectedExchangeRate,
                    CASE
                        WHEN expense_entries.expenseEntryToIban IS NOT NULL
                            AND expense_entries.expenseEntryToIban != ''
                            AND expense_entries.expenseEntryToIban = (
                                SELECT iban FROM accounts WHERE id = income_entries.incomeAccountId AND deleted_at IS NULL
                            )
                        THEN 1
                        WHEN income_entries.incomeEntryToIban IS NOT NULL
                            AND income_entries.incomeEntryToIban != ''
                            AND income_entries.incomeEntryToIban = (
                                SELECT iban FROM accounts WHERE id = expense_entries.expenseAccountId AND deleted_at IS NULL
                            )
                        THEN 1
                        ELSE 0
                    END as ibanMatch,
                    CASE
                        WHEN expense_entries.expenseMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                            OR income_entries.incomeMccGroupId = ${TRANSFER_MCC_GROUP_ID}
                        THEN 1
                        ELSE 0
                    END as hasTransferMcc,
                    CASE
                        WHEN expense_entries.expenseInstrumentId = income_entries.incomeInstrumentId
                        THEN 1
                        ELSE 0
                    END as sameCurrency,
                    CASE
                        WHEN expense_entries.expenseInstrumentId = income_entries.incomeInstrumentId
                            AND expense_entries.expenseEntryAmount = income_entries.incomeEntryAmount
                        THEN 1
                        ELSE 0
                    END as sameCurrencyAmountMatch,
                    CASE
                        WHEN expense_entries.expenseInstrumentId != income_entries.incomeInstrumentId
                            AND expense_entries.expenseEntryExchangeRate > 0
                            AND income_entries.incomeEntryExchangeRate > 0
                            AND expense_entries.expenseEntryExchangeRate != 1
                            AND income_entries.incomeEntryExchangeRate != 1
                            AND ABS(expense_entries.expenseEntryAmount - income_entries.incomeOperationAmount) / expense_entries.expenseEntryAmount <= 0.01
                            AND ABS(income_entries.incomeEntryAmount - expense_entries.expenseOperationAmount) / income_entries.incomeEntryAmount <= 0.01
                        THEN 1
                        ELSE 0
                    END as operationAmountMatch
                FROM expense_entries
                INNER JOIN income_entries ON
                    income_entries.incomeAccountId != expense_entries.expenseAccountId
                    AND income_entries.incomeOperatedAt BETWEEN
                        expense_entries.expenseOperatedAt - ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}
                        AND expense_entries.expenseOperatedAt + ${TRANSFER_PAIR_TIME_WINDOW_SECONDS}
            ),
            scored_pairs AS (
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
                    END as impliedRateMatch
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
                        WHEN hasTransferMcc = 1
                            AND operationAmountMatch = 1
                        THEN 'REVIEW_CROSS_CURRENCY_OPERATION'
                        ELSE NULL
                    END as confidenceBucket,
                    CASE
                        WHEN ibanMatch = 1 THEN 'iban'
                        WHEN operationAmountMatch = 1 THEN 'operation-amount'
                        WHEN impliedRateMatch = 1 THEN 'implied-rate'
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
                                WHEN 'REVIEW_CROSS_CURRENCY_OPERATION' THEN 5
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
                                WHEN 'REVIEW_CROSS_CURRENCY_OPERATION' THEN 5
                                ELSE 99
                            END,
                            timeDiff
                    ) as incomeRank
                FROM compatible_pairs
                WHERE confidenceBucket IS NOT NULL
            )
            SELECT * FROM ranked_pairs
        `;
    }
}
