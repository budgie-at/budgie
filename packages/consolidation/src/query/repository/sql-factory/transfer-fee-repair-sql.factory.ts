import { CategorySourceEnum, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

export const MISSING_TRANSFER_FEE_ENTRIES_SQL = `
    WITH ranked_moved_fees AS (
        SELECT
            moved_entry.transaction_id AS transactionId,
            moved_entry.account_id AS accountId,
            moved_entry.category_id AS categoryId,
            moved_entry.category_source AS categorySource,
            moved_entry.mcc_category_id AS mccCategoryId,
            moved_entry.amount AS amount,
            moved_entry.exchange_rate AS exchangeRate,
            moved_entry.base_instrument_id AS baseInstrumentId,
            moved_entry.base_exchange_rate AS baseExchangeRate,
            moved_entry.base_amount AS baseAmount,
            ROW_NUMBER() OVER (
                PARTITION BY canonical.id, moved_entry.account_id, moved_entry.amount
                ORDER BY moved_entry.id
            ) AS feeRank
        FROM transactions canonical
        INNER JOIN transaction_entries moved_entry ON
            moved_entry.transaction_id = canonical.id
            AND moved_entry.original_transaction_id IS NOT NULL
            AND moved_entry.deleted_at IS NULL
            AND moved_entry.amount > 0
            AND (
                moved_entry.account_id IN (canonical.from_account_id, canonical.to_account_id)
                OR canonical.consolidation_type IN (
                    '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}',
                    '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER}'
                )
            )
            AND (moved_entry.type = '${TransactionEntryTypeEnum.FEE}' OR moved_entry.category_source = '${CategorySourceEnum.FEE}')
        WHERE canonical.deleted_at IS NULL
            AND canonical.type = '${TransactionTypeEnum.TRANSFER}'
            AND canonical.consolidation_parent_transaction_id IS NULL
            AND canonical.updated_by IS NULL
            AND canonical.consolidation_type IN (
                '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}',
                '${TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER}',
                '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}',
                '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER}',
                '${TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL}',
                '${TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER}'
            )
    ),
    live_fee_counts AS (
        SELECT
            live_fee.transaction_id AS transactionId,
            live_fee.account_id AS accountId,
            live_fee.amount AS amount,
            COUNT(*) AS liveCount
        FROM transaction_entries live_fee
        WHERE live_fee.original_transaction_id IS NULL
            AND live_fee.deleted_at IS NULL
            AND (live_fee.type = '${TransactionEntryTypeEnum.FEE}' OR live_fee.category_source = '${CategorySourceEnum.FEE}')
            AND live_fee.amount > 0
            AND live_fee.transaction_id IN (SELECT DISTINCT transactionId FROM ranked_moved_fees)
        GROUP BY live_fee.transaction_id, live_fee.account_id, live_fee.amount
    )
    SELECT
        moved.transactionId AS transactionId,
        moved.accountId AS accountId,
        moved.categoryId AS categoryId,
        moved.categorySource AS categorySource,
        moved.mccCategoryId AS mccCategoryId,
        moved.amount AS amount,
        moved.exchangeRate AS exchangeRate,
        moved.baseInstrumentId AS baseInstrumentId,
        moved.baseExchangeRate AS baseExchangeRate,
        moved.baseAmount AS baseAmount
    FROM ranked_moved_fees moved
    LEFT JOIN live_fee_counts live ON
        live.transactionId = moved.transactionId
        AND live.accountId = moved.accountId
        AND live.amount = moved.amount
    WHERE moved.feeRank > COALESCE(live.liveCount, 0)
`;
