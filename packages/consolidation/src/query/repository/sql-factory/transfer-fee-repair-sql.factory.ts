import { CategorySourceEnum, TransactionConsolidationTypeEnum, TransactionEntryTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

export const MISSING_TRANSFER_FEE_ENTRIES_SQL = `
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
        moved_entry.base_amount AS baseAmount
    FROM transactions canonical
    INNER JOIN transaction_entries moved_entry ON
        moved_entry.transaction_id = canonical.id
        AND moved_entry.original_transaction_id IS NOT NULL
        AND moved_entry.deleted_at IS NULL
        AND moved_entry.amount > 0
        AND moved_entry.account_id IN (canonical.from_account_id, canonical.to_account_id)
        AND (moved_entry.type = '${TransactionEntryTypeEnum.FEE}' OR moved_entry.category_source = '${CategorySourceEnum.FEE}')
    WHERE canonical.deleted_at IS NULL
        AND canonical.type = '${TransactionTypeEnum.TRANSFER}'
        AND canonical.consolidation_parent_transaction_id IS NULL
        AND canonical.consolidation_type IN (
            '${TransactionConsolidationTypeEnum.TRANSFER_PAIR}',
            '${TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER}',
            '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER}',
            '${TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER}',
            '${TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL}'
        )
        AND NOT EXISTS (
            SELECT 1 FROM transaction_entries live_fee
            WHERE live_fee.transaction_id = canonical.id
                AND live_fee.account_id = moved_entry.account_id
                AND live_fee.original_transaction_id IS NULL
                AND live_fee.deleted_at IS NULL
                AND live_fee.type = '${TransactionEntryTypeEnum.FEE}'
        )
`;
