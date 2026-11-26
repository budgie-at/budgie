import {
    TransactionConsolidationTypeEnum,
    TransactionEntryKindEnum,
    TransactionEntryTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';

import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-fast-time-window.constant';
import { TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE } from '../../../shared/constant/transfer-pair-implied-rate-tolerance.constant';
import { buildBridgeClaimTitleConditionSql } from '../../../shared/utils/build-bridge-claim-title-condition-sql.util';

import { TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL } from './transfer-pair-available-exchange-rates-sql.factory';

export const BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL = `
            WITH ${TRANSFER_PAIR_AVAILABLE_EXCHANGE_RATES_SQL}
            ranked_candidates AS (
                SELECT
                    *,
                    ROW_NUMBER() OVER (
                        PARTITION BY canonicalTransferId
                        ORDER BY timeDiff, interbankExpenseTransactionId
                    ) as canonicalRank,
                    ROW_NUMBER() OVER (
                        PARTITION BY interbankExpenseTransactionId
                        ORDER BY timeDiff, canonicalTransferId
                    ) as interbankExpenseRank
                FROM (
                    SELECT
                        canonical.id as canonicalTransferId,
                        claimed_income.id as claimedIncomeTransactionId,
                        fx_expense.id as interbankExpenseTransactionId,
                        ABS(claimed_income.operated_at - fx_expense.operated_at) as timeDiff
                    FROM transactions canonical
                    LEFT JOIN accounts canonical_from_account ON
                        canonical_from_account.id = canonical.from_account_id
                        AND canonical_from_account.deleted_at IS NULL
                    INNER JOIN transaction_entries claimed_income_entry ON
                        claimed_income_entry.transaction_id = canonical.id
                        AND claimed_income_entry.deleted_at IS NULL
                        AND claimed_income_entry.original_transaction_id IS NOT NULL
                        AND claimed_income_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                        AND claimed_income_entry.type = '${TransactionEntryTypeEnum.DEBIT}'
                        AND claimed_income_entry.amount > 0
                    INNER JOIN transactions claimed_income ON
                        claimed_income.id = claimed_income_entry.original_transaction_id
                        AND claimed_income.type = '${TransactionTypeEnum.INCOME}'
                        AND claimed_income.deleted_at IS NULL
                    INNER JOIN accounts claimed_income_account ON
                        claimed_income_account.id = claimed_income_entry.account_id
                        AND claimed_income_account.deleted_at IS NULL
                    INNER JOIN instruments income_instrument ON income_instrument.id = claimed_income_account.instrument_id
                    INNER JOIN transactions fx_expense ON
                        fx_expense.type = '${TransactionTypeEnum.EXPENSE}'
                        AND fx_expense.deleted_at IS NULL
                        AND fx_expense.consolidation_parent_transaction_id IS NULL
                        AND fx_expense.operated_at BETWEEN claimed_income.operated_at - ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                            AND claimed_income.operated_at + ${TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS}
                    INNER JOIN transaction_entries fx_expense_entry ON
                        fx_expense_entry.transaction_id = fx_expense.id
                        AND fx_expense_entry.deleted_at IS NULL
                        AND fx_expense_entry.original_transaction_id IS NULL
                        AND fx_expense_entry.kind = '${TransactionEntryKindEnum.PRIMARY}'
                        AND fx_expense_entry.type = '${TransactionEntryTypeEnum.CREDIT}'
                        AND fx_expense_entry.exchange_rate > 0
                        AND fx_expense_entry.amount > 0
                    INNER JOIN accounts fx_expense_account ON
                        fx_expense_account.id = fx_expense_entry.account_id
                        AND fx_expense_account.deleted_at IS NULL
                        AND fx_expense_account.is_active = 1
                    INNER JOIN instruments fx_instrument ON fx_instrument.id = fx_expense_account.instrument_id
                    INNER JOIN available_exchange_rates aer ON
                        aer.base_instrument_id = fx_instrument.id
                        AND aer.quote_instrument_id = income_instrument.id
                    WHERE canonical.type = '${TransactionTypeEnum.TRANSFER}'
                        AND canonical.consolidation_type = '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}'
                        AND canonical.deleted_at IS NULL
                        AND canonical.consolidation_parent_transaction_id IS NULL
                        AND canonical.updated_by IS NULL
                        AND fx_instrument.id != income_instrument.id
                        AND (
                            (
                                claimed_income_entry.to_iban IS NOT NULL
                                AND claimed_income_entry.to_iban != ''
                                AND claimed_income_entry.to_iban != COALESCE(canonical_from_account.iban, '')
                            )
                            OR ${buildBridgeClaimTitleConditionSql('claimed_income.title', 'income_instrument.code')}
                        )
                        AND ABS(claimed_income_entry.amount * 1.0 / fx_expense_entry.amount - aer.rate) / aer.rate <= ${TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE}
                )
            )
            SELECT
                canonicalTransferId,
                claimedIncomeTransactionId,
                interbankExpenseTransactionId
            FROM ranked_candidates
            WHERE canonicalRank = 1
                AND interbankExpenseRank = 1
`;
