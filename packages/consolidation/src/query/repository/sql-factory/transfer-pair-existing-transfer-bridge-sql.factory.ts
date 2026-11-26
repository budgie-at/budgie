import {
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { IBAN_BRIDGE_CHAIN_FX_TOLERANCE } from '../../../shared/constant/iban-bridge-chain-fx-tolerance.constant';
import { TRANSFER_MCC_GROUP_ID } from '../../../shared/constant/transfer-mcc-group-id.constant';
import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-fast-time-window.constant';
import { TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE } from '../../../shared/constant/transfer-pair-implied-rate-tolerance.constant';
import { operatedAtScopeSql } from '../../utils/operated-at-scope-sql.util';
import { scopedSql } from '../../utils/scoped-sql.util';

import { TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL } from './transfer-pair-available-exchange-rates-sql.factory';

export const EXISTING_TRANSFER_BRIDGE_CANDIDATES_SQL = scopedSql`
            WITH ${TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL}
            ranked_candidates AS (
                SELECT
                    source_expense_tx.id as sourceExpenseTransactionId,
                    source_expense_tx.title as sourceExpenseTransactionTitle,
                    source_expense_entry.to_iban as sourceExpenseEntryToIban,
                    bridge_income_tx.id as bridgeIncomeTransactionId,
                    bridge_income_tx.title as bridgeIncomeTransactionTitle,
                    existing_transfer.id as existingTransferId,
                    existing_transfer.title as existingTransferTitle,
                    existing_transfer.operated_at as operatedAt,
                    source_account.id as sourceAccountId,
                    bridge_account.id as bridgeAccountId,
                    target_account.id as targetAccountId,
                    source_expense_entry.amount as sourceAmount,
                    bridge_income_entry.amount as targetAmount,
                    MAX(
                        ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                        ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                    ) as timeDiff,
                    ROW_NUMBER() OVER (
                        PARTITION BY source_expense_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                            ),
                            bridge_income_tx.id,
                            existing_transfer.id
                    ) as sourceExpenseRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY bridge_income_tx.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            existing_transfer.id
                    ) as bridgeIncomeRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY existing_transfer.id
                        ORDER BY
                            MAX(
                                ABS(bridge_income_tx.operated_at - source_expense_tx.operated_at),
                                ABS(existing_transfer.operated_at - bridge_income_tx.operated_at)
                            ),
                            source_expense_tx.id,
                            bridge_income_tx.id
                    ) as existingTransferRank
                FROM transactions existing_transfer
                INNER JOIN accounts bridge_account ON
                    bridge_account.id = existing_transfer.from_account_id
                    AND bridge_account.deleted_at IS NULL
                    AND bridge_account.is_active = 1
                INNER JOIN transaction_entries existing_bridge_entry ON
                    existing_bridge_entry.transaction_id = existing_transfer.id
                    AND existing_bridge_entry.deleted_at IS NULL
                    AND existing_bridge_entry.original_transaction_id IS NULL
                    AND existing_bridge_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND existing_bridge_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                    AND existing_bridge_entry.amount > 0
                    AND existing_bridge_entry.account_id = bridge_account.id
                INNER JOIN transaction_entries existing_target_entry ON
                    existing_target_entry.transaction_id = existing_transfer.id
                    AND existing_target_entry.deleted_at IS NULL
                    AND existing_target_entry.original_transaction_id IS NULL
                    AND existing_target_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND existing_target_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                    AND existing_target_entry.account_id = existing_transfer.to_account_id
                    AND existing_target_entry.amount = existing_bridge_entry.amount
                INNER JOIN accounts target_account ON
                    target_account.id = existing_target_entry.account_id
                    AND target_account.deleted_at IS NULL
                    AND target_account.is_active = 1
                    AND target_account.instrument_id = bridge_account.instrument_id
                INNER JOIN transaction_entries bridge_income_entry ON
                    bridge_income_entry.deleted_at IS NULL
                    AND bridge_income_entry.original_transaction_id IS NULL
                    AND bridge_income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                    AND bridge_income_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                    AND bridge_income_entry.account_id = bridge_account.id
                    AND bridge_income_entry.amount = existing_bridge_entry.amount
                    AND bridge_income_entry.exchange_rate > 0
                INNER JOIN transactions bridge_income_tx ON
                    bridge_income_tx.id = bridge_income_entry.transaction_id
                    AND bridge_income_tx.type = '${TransactionTypeEnum.INCOME}'
                    AND bridge_income_tx.deleted_at IS NULL
                    AND bridge_income_tx.consolidation_parent_transaction_id IS NULL
                    AND bridge_income_tx.operated_at BETWEEN existing_transfer.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND existing_transfer.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${operatedAtScopeSql('bridge_income_tx.operated_at')}
                INNER JOIN transactions source_expense_tx ON
                    source_expense_tx.type = '${TransactionTypeEnum.EXPENSE}'
                    AND source_expense_tx.deleted_at IS NULL
                    AND source_expense_tx.consolidation_parent_transaction_id IS NULL
                    AND source_expense_tx.consolidation_type IS NOT '${TransactionConsolidationTypeEnum.REFUND}'
                    AND source_expense_tx.operated_at BETWEEN bridge_income_tx.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                        AND bridge_income_tx.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    ${operatedAtScopeSql('source_expense_tx.operated_at')}
                INNER JOIN transaction_entries source_expense_entry ON
                    source_expense_entry.transaction_id = source_expense_tx.id
                    AND source_expense_entry.deleted_at IS NULL
                    AND source_expense_entry.original_transaction_id IS NULL
                    AND source_expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                    AND source_expense_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                    AND source_expense_entry.amount > 0
                    AND source_expense_entry.exchange_rate > 0
                INNER JOIN accounts source_account ON
                    source_account.id = source_expense_entry.account_id
                    AND source_account.deleted_at IS NULL
                    AND source_account.is_active = 1
                    AND source_account.instrument_id != bridge_account.instrument_id
                LEFT JOIN mcc_categories expense_mcc ON expense_mcc.id = source_expense_entry.mcc_category_id
                LEFT JOIN mcc_categories bridge_income_mcc ON bridge_income_mcc.id = bridge_income_entry.mcc_category_id
                LEFT JOIN available_exchange_rates aer ON
                    aer.base_instrument_id = source_account.instrument_id
                    AND aer.quote_instrument_id = bridge_account.instrument_id
                WHERE existing_transfer.type = '${TransactionTypeEnum.TRANSFER}'
                    AND existing_transfer.deleted_at IS NULL
                    AND existing_transfer.consolidation_parent_transaction_id IS NULL
                    AND existing_transfer.from_account_id IS NOT NULL
                    AND existing_transfer.to_account_id IS NOT NULL
                    ${operatedAtScopeSql('existing_transfer.operated_at')}
                    AND source_account.id != bridge_account.id
                    AND bridge_account.id != target_account.id
                    AND source_account.id != target_account.id
                    AND (expense_mcc.mcc_group_id IS NULL OR expense_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (bridge_income_mcc.mcc_group_id IS NULL OR bridge_income_mcc.mcc_group_id = ${TRANSFER_MCC_GROUP_ID})
                    AND (
                        (
                            bridge_income_entry.to_iban IS NOT NULL
                            AND bridge_income_entry.to_iban != ''
                            AND bridge_income_entry.to_iban = source_account.iban
                            AND (
                                ABS(source_expense_entry.amount - (bridge_income_entry.amount * 1.0 / bridge_income_entry.exchange_rate)) / source_expense_entry.amount <= ${IBAN_BRIDGE_CHAIN_FX_TOLERANCE}
                                OR ABS(bridge_income_entry.amount - (source_expense_entry.amount * 1.0 / source_expense_entry.exchange_rate)) / bridge_income_entry.amount <= ${IBAN_BRIDGE_CHAIN_FX_TOLERANCE}
                            )
                        )
                        OR (
                            aer.rate IS NOT NULL
                            AND ABS((bridge_income_entry.amount * 1.0 / source_expense_entry.amount) - aer.rate) / aer.rate <= ${TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE}
                        )
                    )
            )
            SELECT
                'AUTO_EXISTING_TRANSFER_BRIDGE' as confidenceBucket,
                sourceExpenseTransactionId,
                sourceExpenseTransactionTitle,
                sourceExpenseEntryToIban,
                bridgeIncomeTransactionId,
                bridgeIncomeTransactionTitle,
                existingTransferId,
                existingTransferTitle,
                operatedAt,
                sourceAccountId,
                bridgeAccountId,
                targetAccountId,
                sourceAmount,
                targetAmount,
                sourceAmount * 1.0 / targetAmount as exchangeRate,
                timeDiff
            FROM ranked_candidates
            WHERE sourceExpenseRank = 1
                AND bridgeIncomeRank = 1
                AND existingTransferRank = 1
`;
