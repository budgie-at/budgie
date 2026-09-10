import { TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

import { TRANSFER_PAIR_FAST_TIME_WINDOW_SECONDS } from '../../../shared/constant/transfer-pair-fast-time-window.constant';
import { TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE } from '../../../shared/constant/transfer-pair-implied-rate-tolerance.constant';
import { buildBridgeClaimTitleConditionSql } from '../../../shared/util/build-bridge-claim-title-condition-sql.util';

const BRIDGE_CLAIM_REPAIR_CANDIDATES_BASE_SQL = `
            WITH latest_exchange_rates AS (
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
            direct_exchange_rates AS (
                SELECT base_instrument_id, quote_instrument_id, rate, 0 as direction
                FROM latest_exchange_rates
                WHERE exchangeRateRank = 1
                UNION ALL
                SELECT quote_instrument_id as base_instrument_id, base_instrument_id as quote_instrument_id, 1.0 / rate as rate, 1 as direction
                FROM latest_exchange_rates
                WHERE exchangeRateRank = 1
            ),
            base_triangulated_rates AS (
                SELECT
                    first_leg.base_instrument_id as base_instrument_id,
                    second_leg.quote_instrument_id as quote_instrument_id,
                    first_leg.rate * second_leg.rate as rate,
                    2 as direction
                FROM direct_exchange_rates first_leg
                INNER JOIN direct_exchange_rates second_leg
                    ON first_leg.quote_instrument_id = second_leg.base_instrument_id
                WHERE first_leg.quote_instrument_id = (SELECT default_instrument_id FROM settings LIMIT 1)
                    AND first_leg.base_instrument_id != second_leg.quote_instrument_id
            ),
            available_exchange_rates AS (
                SELECT base_instrument_id, quote_instrument_id, rate FROM (
                    SELECT
                        base_instrument_id,
                        quote_instrument_id,
                        rate,
                        ROW_NUMBER() OVER (
                            PARTITION BY base_instrument_id, quote_instrument_id
                            ORDER BY direction
                        ) as directionRank
                    FROM (
                        SELECT base_instrument_id, quote_instrument_id, rate, direction FROM direct_exchange_rates
                        UNION ALL
                        SELECT base_instrument_id, quote_instrument_id, rate, direction FROM base_triangulated_rates
                    )
                )
                WHERE directionRank = 1
            ),
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
                    INNER JOIN transaction_entries claimed_income_entry ON
                        claimed_income_entry.transaction_id = canonical.id
                        AND claimed_income_entry.deleted_at IS NULL
                        AND claimed_income_entry.original_transaction_id IS NOT NULL
                        AND claimed_income_entry.type = 'DEBIT'
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
                        AND fx_expense_entry.type = 'CREDIT'
                        AND fx_expense_entry.exchange_rate > 0
                        AND fx_expense_entry.amount > 0
                    INNER JOIN accounts fx_expense_account ON
                        fx_expense_account.id = fx_expense_entry.account_id
                        AND fx_expense_account.deleted_at IS NULL
                        AND fx_expense_account.is_active = 1
                    INNER JOIN instruments fx_instrument ON fx_instrument.id = fx_expense_account.instrument_id
                    WHERE canonical.type = '${TransactionTypeEnum.TRANSFER}'
                        AND canonical.consolidation_type = '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}'
                        AND canonical.deleted_at IS NULL
                        AND canonical.consolidation_parent_transaction_id IS NULL
                        AND fx_instrument.id != income_instrument.id
                        AND (
                            (
                                claimed_income_entry.to_iban IS NOT NULL
                                AND claimed_income_entry.to_iban != ''
                                AND claimed_income_entry.to_iban != COALESCE(
                                    (SELECT iban FROM accounts WHERE id = canonical.from_account_id AND deleted_at IS NULL),
                                    ''
                                )
                            )
                            OR ${buildBridgeClaimTitleConditionSql('claimed_income.title', 'income_instrument.code')}
                        )
                        AND (
                            SELECT rate FROM available_exchange_rates
                            WHERE base_instrument_id = fx_instrument.id AND quote_instrument_id = income_instrument.id
                            LIMIT 1
                        ) IS NOT NULL
                        AND ABS(
                            claimed_income_entry.amount * 1.0 / fx_expense_entry.amount
                            - (
                                SELECT rate FROM available_exchange_rates
                                WHERE base_instrument_id = fx_instrument.id AND quote_instrument_id = income_instrument.id
                                LIMIT 1
                            )
                        ) / (
                            SELECT rate FROM available_exchange_rates
                            WHERE base_instrument_id = fx_instrument.id AND quote_instrument_id = income_instrument.id
                            LIMIT 1
                        ) <= ${TRANSFER_PAIR_IMPLIED_RATE_TOLERANCE}
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

export const BRIDGE_CLAIM_REPAIR_CANDIDATES_SQL = BRIDGE_CLAIM_REPAIR_CANDIDATES_BASE_SQL;
