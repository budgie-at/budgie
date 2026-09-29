-- Retires ledger-less consolidation children of deleted canonicals and entry-less transaction shells, then clears foreign-key orphans.
UPDATE transactions
SET deleted_at = (SELECT parent.deleted_at FROM transactions parent WHERE parent.id = transactions.consolidation_parent_transaction_id),
    updated_at = unixepoch()
WHERE deleted_at IS NULL
    AND consolidation_parent_transaction_id IN (SELECT id FROM transactions WHERE deleted_at IS NOT NULL)
    AND NOT EXISTS (
        SELECT 1 FROM transaction_entries
        WHERE deleted_at IS NULL
            AND (transaction_id = transactions.id OR original_transaction_id = transactions.id)
    );
--> statement-breakpoint
UPDATE transactions
SET deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL
    AND NOT EXISTS (SELECT 1 FROM transaction_entries WHERE transaction_id = transactions.id AND deleted_at IS NULL AND original_transaction_id IS NULL)
    AND NOT EXISTS (SELECT 1 FROM transactions child WHERE child.consolidation_parent_transaction_id = transactions.id AND child.deleted_at IS NULL)
    AND NOT EXISTS (SELECT 1 FROM debt_events WHERE transaction_id = transactions.id AND deleted_at IS NULL);
--> statement-breakpoint
DELETE FROM transaction_tags
WHERE transaction_id NOT IN (SELECT id FROM transactions)
    OR tag_id NOT IN (SELECT id FROM tags);
--> statement-breakpoint
UPDATE debt_events
SET transaction_entry_id = (
        SELECT live_primary_entries.id
        FROM transaction_entries live_primary_entries
        WHERE live_primary_entries.transaction_id = debt_events.transaction_id
            AND live_primary_entries.kind = 'PRIMARY'
            AND live_primary_entries.type != 'FEE'
            AND live_primary_entries.deleted_at IS NULL
            AND live_primary_entries.original_transaction_id IS NULL
            AND (
                SELECT COUNT(*)
                FROM transaction_entries other_entries
                WHERE other_entries.transaction_id = debt_events.transaction_id
                    AND other_entries.kind = 'PRIMARY'
                    AND other_entries.type != 'FEE'
                    AND other_entries.deleted_at IS NULL
                    AND other_entries.original_transaction_id IS NULL
            ) = 1
    ),
    updated_at = unixepoch()
WHERE transaction_entry_id IS NOT NULL
    AND transaction_entry_id NOT IN (SELECT id FROM transaction_entries);
--> statement-breakpoint
DELETE FROM bank_syncs
WHERE account_id NOT IN (SELECT id FROM accounts);
