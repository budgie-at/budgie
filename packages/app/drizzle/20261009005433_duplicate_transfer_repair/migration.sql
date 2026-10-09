DROP TABLE IF EXISTS duplicate_transfer_candidate_transfers;
--> statement-breakpoint
DROP TABLE IF EXISTS duplicate_transfer_signature_counts;
--> statement-breakpoint
DROP TABLE IF EXISTS duplicate_transfer_repair_pairs;
--> statement-breakpoint
CREATE TEMP TABLE duplicate_transfer_signature_counts AS
SELECT
    source_entry.account_id AS source_account_id,
    target_entry.account_id AS target_account_id,
    source_entry.amount AS source_amount,
    target_entry.amount AS target_amount,
    COUNT(*) AS transfer_count,
    SUM(CASE WHEN tx.consolidation_type = 'IBAN_BRIDGE_TRANSFER' THEN 1 ELSE 0 END) AS bridge_count
FROM transactions tx
INNER JOIN transaction_entries source_entry ON source_entry.transaction_id = tx.id
    AND source_entry.deleted_at IS NULL
    AND source_entry.original_transaction_id IS NULL
    AND source_entry.type = 'CREDIT'
INNER JOIN transaction_entries target_entry ON target_entry.transaction_id = tx.id
    AND target_entry.deleted_at IS NULL
    AND target_entry.original_transaction_id IS NULL
    AND target_entry.type = 'DEBIT'
WHERE tx.deleted_at IS NULL
    AND tx.consolidation_parent_transaction_id IS NULL
    AND tx.type = 'TRANSFER'
    AND tx.consolidation_type IN ('IBAN_BRIDGE_TRANSFER', 'TRANSFER_PAIR')
    AND tx.from_account_id = source_entry.account_id
    AND tx.to_account_id = target_entry.account_id
    AND source_entry.account_id != target_entry.account_id
    AND source_entry.amount > 0
    AND target_entry.amount > 0
GROUP BY source_entry.account_id, target_entry.account_id, source_entry.amount, target_entry.amount;
--> statement-breakpoint
CREATE TEMP TABLE duplicate_transfer_candidate_transfers AS
SELECT
    tx.id,
    tx.created_at,
    tx.operated_at,
    tx.consolidation_type,
    source_entry.id AS source_entry_id,
    target_entry.id AS target_entry_id,
    source_entry.account_id AS source_account_id,
    target_entry.account_id AS target_account_id,
    source_entry.amount AS source_amount,
    target_entry.amount AS target_amount,
    source_account.iban AS source_iban,
    target_account.iban AS target_iban
FROM transactions tx
INNER JOIN transaction_entries source_entry ON source_entry.transaction_id = tx.id
    AND source_entry.deleted_at IS NULL
    AND source_entry.original_transaction_id IS NULL
    AND source_entry.type = 'CREDIT'
INNER JOIN transaction_entries target_entry ON target_entry.transaction_id = tx.id
    AND target_entry.deleted_at IS NULL
    AND target_entry.original_transaction_id IS NULL
    AND target_entry.type = 'DEBIT'
INNER JOIN accounts source_account ON source_account.id = source_entry.account_id
    AND source_account.deleted_at IS NULL
INNER JOIN accounts target_account ON target_account.id = target_entry.account_id
    AND target_account.deleted_at IS NULL
WHERE tx.deleted_at IS NULL
    AND tx.consolidation_parent_transaction_id IS NULL
    AND tx.updated_by IS NULL
    AND tx.type = 'TRANSFER'
    AND tx.consolidation_type IN ('IBAN_BRIDGE_TRANSFER', 'TRANSFER_PAIR')
    AND tx.from_account_id = source_entry.account_id
    AND tx.to_account_id = target_entry.account_id
    AND source_entry.account_id != target_entry.account_id
    AND source_entry.amount > 0
    AND target_entry.amount > 0
    AND source_account.iban IS NOT NULL
    AND source_account.iban != ''
    AND target_account.iban IS NOT NULL
    AND target_account.iban != '';
--> statement-breakpoint
DELETE FROM duplicate_transfer_candidate_transfers
WHERE EXISTS (
    SELECT 1
    FROM transaction_entries extra_entry
    WHERE extra_entry.transaction_id = duplicate_transfer_candidate_transfers.id
        AND extra_entry.deleted_at IS NULL
        AND extra_entry.original_transaction_id IS NULL
        AND extra_entry.id NOT IN (
            duplicate_transfer_candidate_transfers.source_entry_id,
            duplicate_transfer_candidate_transfers.target_entry_id
        )
);
--> statement-breakpoint
DELETE FROM duplicate_transfer_candidate_transfers
WHERE (
    SELECT COUNT(*)
    FROM transaction_entries moved_entry
    WHERE moved_entry.transaction_id = duplicate_transfer_candidate_transfers.id
        AND moved_entry.deleted_at IS NULL
        AND moved_entry.original_transaction_id IS NOT NULL
) != 2
    OR (
        SELECT COUNT(*)
        FROM transaction_entries moved_entry
        INNER JOIN transactions original_tx ON original_tx.id = moved_entry.original_transaction_id
            AND original_tx.deleted_at IS NULL
            AND original_tx.consolidation_parent_transaction_id = duplicate_transfer_candidate_transfers.id
            AND original_tx.updated_by IS NULL
            AND original_tx.type IN ('EXPENSE', 'INCOME')
        WHERE moved_entry.transaction_id = duplicate_transfer_candidate_transfers.id
            AND moved_entry.deleted_at IS NULL
            AND moved_entry.original_transaction_id IS NOT NULL
    ) != 2;
--> statement-breakpoint
DELETE FROM duplicate_transfer_candidate_transfers
WHERE consolidation_type = 'IBAN_BRIDGE_TRANSFER'
    AND NOT EXISTS (
        SELECT 1
        FROM transaction_entries bridge_expense_entry
        INNER JOIN transactions bridge_expense_tx ON bridge_expense_tx.id = bridge_expense_entry.original_transaction_id
            AND bridge_expense_tx.deleted_at IS NULL
            AND bridge_expense_tx.consolidation_parent_transaction_id = duplicate_transfer_candidate_transfers.id
            AND bridge_expense_tx.updated_by IS NULL
            AND bridge_expense_tx.type = 'EXPENSE'
        INNER JOIN transaction_entries bridge_income_entry ON bridge_income_entry.transaction_id = duplicate_transfer_candidate_transfers.id
            AND bridge_income_entry.deleted_at IS NULL
            AND bridge_income_entry.original_transaction_id IS NOT NULL
            AND bridge_income_entry.type = 'DEBIT'
            AND bridge_income_entry.account_id = bridge_expense_entry.account_id
            AND bridge_income_entry.amount = duplicate_transfer_candidate_transfers.target_amount
            AND bridge_income_entry.to_iban = duplicate_transfer_candidate_transfers.source_iban
            AND ABS(ROUND(bridge_income_entry.amount / bridge_income_entry.exchange_rate) - duplicate_transfer_candidate_transfers.source_amount) <= 10000
        INNER JOIN transactions bridge_income_tx ON bridge_income_tx.id = bridge_income_entry.original_transaction_id
            AND bridge_income_tx.deleted_at IS NULL
            AND bridge_income_tx.consolidation_parent_transaction_id = duplicate_transfer_candidate_transfers.id
            AND bridge_income_tx.updated_by IS NULL
            AND bridge_income_tx.type = 'INCOME'
        WHERE bridge_expense_entry.transaction_id = duplicate_transfer_candidate_transfers.id
            AND bridge_expense_entry.deleted_at IS NULL
            AND bridge_expense_entry.original_transaction_id IS NOT NULL
            AND bridge_expense_entry.type = 'CREDIT'
            AND bridge_expense_entry.account_id NOT IN (
                duplicate_transfer_candidate_transfers.source_account_id,
                duplicate_transfer_candidate_transfers.target_account_id
            )
            AND bridge_expense_entry.amount = duplicate_transfer_candidate_transfers.target_amount
            AND bridge_expense_entry.to_iban = duplicate_transfer_candidate_transfers.target_iban
    );
--> statement-breakpoint
DELETE FROM duplicate_transfer_candidate_transfers
WHERE consolidation_type = 'TRANSFER_PAIR'
    AND NOT EXISTS (
        SELECT 1
        FROM transaction_entries source_original_entry
        INNER JOIN transactions source_original_tx ON source_original_tx.id = source_original_entry.original_transaction_id
            AND source_original_tx.deleted_at IS NULL
            AND source_original_tx.consolidation_parent_transaction_id = duplicate_transfer_candidate_transfers.id
            AND source_original_tx.updated_by IS NULL
            AND source_original_tx.type = 'EXPENSE'
        INNER JOIN transaction_entries target_original_entry ON target_original_entry.transaction_id = duplicate_transfer_candidate_transfers.id
            AND target_original_entry.deleted_at IS NULL
            AND target_original_entry.original_transaction_id IS NOT NULL
            AND target_original_entry.type = 'DEBIT'
            AND target_original_entry.account_id = duplicate_transfer_candidate_transfers.target_account_id
            AND target_original_entry.amount = duplicate_transfer_candidate_transfers.target_amount
        INNER JOIN transactions target_original_tx ON target_original_tx.id = target_original_entry.original_transaction_id
            AND target_original_tx.deleted_at IS NULL
            AND target_original_tx.consolidation_parent_transaction_id = duplicate_transfer_candidate_transfers.id
            AND target_original_tx.updated_by IS NULL
            AND target_original_tx.type = 'INCOME'
        WHERE source_original_entry.transaction_id = duplicate_transfer_candidate_transfers.id
            AND source_original_entry.deleted_at IS NULL
            AND source_original_entry.original_transaction_id IS NOT NULL
            AND source_original_entry.type = 'CREDIT'
            AND source_original_entry.account_id = duplicate_transfer_candidate_transfers.source_account_id
            AND source_original_entry.amount = duplicate_transfer_candidate_transfers.source_amount
    );
--> statement-breakpoint
DELETE FROM duplicate_transfer_candidate_transfers
WHERE NOT EXISTS (
    SELECT 1
    FROM bank_syncs source_sync
    INNER JOIN transactions source_adjustment ON source_adjustment.id = source_sync.balance_adjustment_transaction_id
        AND source_adjustment.deleted_at IS NULL
        AND source_adjustment.updated_by IS NULL
        AND source_adjustment.type = 'ADJUSTMENT'
        AND (
            source_adjustment.from_account_id = duplicate_transfer_candidate_transfers.source_account_id
            OR source_adjustment.to_account_id = duplicate_transfer_candidate_transfers.source_account_id
        )
        AND duplicate_transfer_candidate_transfers.created_at > source_adjustment.created_at
    INNER JOIN account_balances source_balance ON source_balance.account_id = duplicate_transfer_candidate_transfers.source_account_id
        AND source_balance.deleted_at IS NULL
        AND source_balance.updated_at > duplicate_transfer_candidate_transfers.created_at
    INNER JOIN bank_syncs target_sync ON target_sync.account_id = duplicate_transfer_candidate_transfers.target_account_id
        AND target_sync.deleted_at IS NULL
        AND target_sync.mode = 'FORWARD'
        AND target_sync.setup_balance IS NULL
        AND target_sync.balance_adjustment_transaction_id IS NOT NULL
    INNER JOIN transactions target_adjustment ON target_adjustment.id = target_sync.balance_adjustment_transaction_id
        AND target_adjustment.deleted_at IS NULL
        AND target_adjustment.updated_by IS NULL
        AND target_adjustment.type = 'ADJUSTMENT'
        AND (
            target_adjustment.from_account_id = duplicate_transfer_candidate_transfers.target_account_id
            OR target_adjustment.to_account_id = duplicate_transfer_candidate_transfers.target_account_id
        )
        AND duplicate_transfer_candidate_transfers.created_at > target_adjustment.created_at
    INNER JOIN account_balances target_balance ON target_balance.account_id = duplicate_transfer_candidate_transfers.target_account_id
        AND target_balance.deleted_at IS NULL
        AND target_balance.updated_at > duplicate_transfer_candidate_transfers.created_at
    WHERE source_sync.account_id = duplicate_transfer_candidate_transfers.source_account_id
        AND source_sync.deleted_at IS NULL
        AND source_sync.mode = 'FORWARD'
        AND source_sync.setup_balance IS NULL
        AND source_sync.balance_adjustment_transaction_id IS NOT NULL
);
--> statement-breakpoint
CREATE TEMP TABLE duplicate_transfer_repair_pairs AS
WITH safe_signatures AS (
    SELECT
        source_account_id,
        target_account_id,
        source_amount,
        target_amount
    FROM duplicate_transfer_candidate_transfers
    INNER JOIN duplicate_transfer_signature_counts signature_counts USING (
        source_account_id,
        target_account_id,
        source_amount,
        target_amount
    )
    WHERE signature_counts.transfer_count = 2
        AND signature_counts.bridge_count = 1
    GROUP BY source_account_id, target_account_id, source_amount, target_amount
    HAVING COUNT(*) = 2
)
SELECT
    bridge.id AS keeper_id,
    pair.id AS hidden_id,
    pair.source_account_id,
    pair.target_account_id,
    pair.source_amount,
    pair.target_amount
FROM safe_signatures signature
INNER JOIN duplicate_transfer_candidate_transfers bridge ON bridge.source_account_id = signature.source_account_id
    AND bridge.target_account_id = signature.target_account_id
    AND bridge.source_amount = signature.source_amount
    AND bridge.target_amount = signature.target_amount
    AND bridge.consolidation_type = 'IBAN_BRIDGE_TRANSFER'
INNER JOIN duplicate_transfer_candidate_transfers pair ON pair.source_account_id = signature.source_account_id
    AND pair.target_account_id = signature.target_account_id
    AND pair.source_amount = signature.source_amount
    AND pair.target_amount = signature.target_amount
    AND pair.consolidation_type = 'TRANSFER_PAIR'
    AND ABS(pair.operated_at - bridge.operated_at) <= 60
    AND NOT EXISTS (
        SELECT 1
        FROM transaction_entries pair_original_entry
        INNER JOIN transactions pair_original_tx ON pair_original_tx.id = pair_original_entry.original_transaction_id
        WHERE pair_original_entry.transaction_id = pair.id
            AND pair_original_entry.deleted_at IS NULL
            AND pair_original_entry.original_transaction_id IS NOT NULL
            AND NOT EXISTS (
                SELECT 1
                FROM transaction_entries bridge_original_entry
                INNER JOIN transactions bridge_original_tx ON bridge_original_tx.id = bridge_original_entry.original_transaction_id
                    AND bridge_original_tx.deleted_at IS NULL
                    AND bridge_original_tx.consolidation_parent_transaction_id = bridge.id
                    AND bridge_original_tx.type = pair_original_tx.type
                    AND bridge_original_tx.external_source = pair_original_tx.external_source
                    AND bridge_original_tx.external_source = 'MONOBANK'
                    AND bridge_original_tx.external_id = pair_original_tx.external_id
                WHERE bridge_original_entry.transaction_id = bridge.id
                    AND bridge_original_entry.deleted_at IS NULL
                    AND bridge_original_entry.account_id = pair_original_entry.account_id
                    AND bridge_original_entry.type = pair_original_entry.type
                    AND bridge_original_tx.external_id IS NOT NULL
                    AND bridge_original_tx.external_id != ''
            )
    )
    AND EXISTS (
        SELECT 1
        FROM transaction_entries pair_source_original_entry
        INNER JOIN accounts bridge_account ON bridge_account.iban = pair_source_original_entry.to_iban
            AND bridge_account.deleted_at IS NULL
        INNER JOIN transaction_entries bridge_expense_entry ON bridge_expense_entry.transaction_id = bridge.id
            AND bridge_expense_entry.deleted_at IS NULL
            AND bridge_expense_entry.original_transaction_id IS NOT NULL
            AND bridge_expense_entry.type = 'CREDIT'
            AND bridge_expense_entry.account_id = bridge_account.id
        WHERE pair_source_original_entry.transaction_id = pair.id
            AND pair_source_original_entry.deleted_at IS NULL
            AND pair_source_original_entry.original_transaction_id IS NOT NULL
            AND pair_source_original_entry.type = 'CREDIT'
            AND pair_source_original_entry.account_id = pair.source_account_id
            AND pair_source_original_entry.amount = pair.source_amount
            AND pair_source_original_entry.to_iban IS NOT NULL
            AND pair_source_original_entry.to_iban != ''
    );
--> statement-breakpoint
UPDATE transaction_entries
SET transaction_id = (
    SELECT keeper_id
    FROM duplicate_transfer_repair_pairs
    WHERE hidden_id = transaction_entries.transaction_id
)
WHERE deleted_at IS NULL
    AND original_transaction_id IS NOT NULL
    AND transaction_id IN (SELECT hidden_id FROM duplicate_transfer_repair_pairs);
--> statement-breakpoint
UPDATE transactions
SET
    consolidation_parent_transaction_id = (
        SELECT keeper_id
        FROM duplicate_transfer_repair_pairs
        INNER JOIN transaction_entries moved_entry ON moved_entry.transaction_id = duplicate_transfer_repair_pairs.keeper_id
            AND moved_entry.original_transaction_id = transactions.id
        WHERE hidden_id = transactions.consolidation_parent_transaction_id
    ),
    updated_at = unixepoch()
WHERE deleted_at IS NULL
    AND consolidation_parent_transaction_id IN (SELECT hidden_id FROM duplicate_transfer_repair_pairs)
    AND id IN (
        SELECT moved_entry.original_transaction_id
        FROM transaction_entries moved_entry
        INNER JOIN duplicate_transfer_repair_pairs repair ON repair.keeper_id = moved_entry.transaction_id
        WHERE moved_entry.deleted_at IS NULL
            AND moved_entry.original_transaction_id IS NOT NULL
    );
--> statement-breakpoint
INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id, is_primary, source)
SELECT repair.keeper_id, tag.tag_id, tag.is_primary, tag.source
FROM transaction_tags tag
INNER JOIN duplicate_transfer_repair_pairs repair ON repair.hidden_id = tag.transaction_id;
--> statement-breakpoint
UPDATE transactions
SET
    consolidation_parent_transaction_id = (
        SELECT keeper_id
        FROM duplicate_transfer_repair_pairs
        WHERE hidden_id = transactions.id
    ),
    updated_at = unixepoch()
WHERE deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL
    AND id IN (SELECT hidden_id FROM duplicate_transfer_repair_pairs);
--> statement-breakpoint
UPDATE account_balances
SET
    amount = amount + (
        SELECT COALESCE(SUM(source_amount), 0)
        FROM duplicate_transfer_repair_pairs
        WHERE source_account_id = account_balances.account_id
    ),
    updated_at = unixepoch()
WHERE account_id IN (SELECT source_account_id FROM duplicate_transfer_repair_pairs);
--> statement-breakpoint
UPDATE account_balances
SET
    amount = amount - (
        SELECT COALESCE(SUM(target_amount), 0)
        FROM duplicate_transfer_repair_pairs
        WHERE target_account_id = account_balances.account_id
    ),
    updated_at = unixepoch()
WHERE account_id IN (SELECT target_account_id FROM duplicate_transfer_repair_pairs);
--> statement-breakpoint
DROP TABLE IF EXISTS duplicate_transfer_candidate_transfers;
--> statement-breakpoint
DROP TABLE IF EXISTS duplicate_transfer_signature_counts;
--> statement-breakpoint
DROP TABLE IF EXISTS duplicate_transfer_repair_pairs;
