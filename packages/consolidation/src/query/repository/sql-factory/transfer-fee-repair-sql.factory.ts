import { TransactionConsolidationTypeEnum, TransactionTypeEnum } from '@budgie/contracts';

const FEE_CARRYING_CONSOLIDATION_TYPES_SQL = [
    TransactionConsolidationTypeEnum.TRANSFER_PAIR,
    TransactionConsolidationTypeEnum.SAME_BANK_HINTED_FEE_TRANSFER,
    TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
    TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
    TransactionConsolidationTypeEnum.ATM_CASH_WITHDRAWAL
]
    .map(consolidationType => `'${consolidationType}'`)
    .join(', ');

export const MISSING_TRANSFER_FEE_REPAIR_CANDIDATES_SQL = `
    SELECT DISTINCT canonical.id AS canonicalTransferId
    FROM transactions canonical
    INNER JOIN transaction_entries moved_entry ON
        moved_entry.transaction_id = canonical.id
        AND moved_entry.original_transaction_id IS NOT NULL
        AND moved_entry.deleted_at IS NULL
    WHERE canonical.deleted_at IS NULL
        AND canonical.type = '${TransactionTypeEnum.TRANSFER}'
        AND canonical.consolidation_parent_transaction_id IS NULL
        AND canonical.consolidation_type IN (${FEE_CARRYING_CONSOLIDATION_TYPES_SQL})
        AND (moved_entry.type = 'FEE' OR moved_entry.category_source = 'FEE')
        AND moved_entry.amount > 0
        AND moved_entry.account_id IN (canonical.from_account_id, canonical.to_account_id)
        AND NOT EXISTS (
            SELECT 1 FROM transaction_entries live_fee
            WHERE live_fee.transaction_id = canonical.id
                AND live_fee.original_transaction_id IS NULL
                AND live_fee.deleted_at IS NULL
                AND live_fee.type = 'FEE'
                AND live_fee.account_id = moved_entry.account_id
        )
`;
