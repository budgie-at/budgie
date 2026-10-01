-- Undoes ATM cash transfers built from Monobank withdrawals imported before mcc_categories was seeded, whose MCC only came from the 0065 backfill.
CREATE TEMP TABLE backfilled_atm_transfers AS
SELECT DISTINCT canonical.id
FROM transactions canonical
INNER JOIN transaction_entries moved_entry ON moved_entry.transaction_id = canonical.id
WHERE canonical.consolidation_type = 'ATM_CASH_WITHDRAWAL'
  AND canonical.external_id IS NULL
  AND canonical.external_source IS NULL
  AND moved_entry.original_transaction_id IS NOT NULL
  AND moved_entry.deleted_at IS NULL
  AND moved_entry.created_at < (SELECT MIN(created_at) FROM mcc_categories);
--> statement-breakpoint
UPDATE transaction_entries
SET transaction_id = original_transaction_id,
    original_transaction_id = NULL,
    updated_at = unixepoch()
WHERE transaction_id IN (SELECT id FROM backfilled_atm_transfers)
  AND original_transaction_id IS NOT NULL
  AND deleted_at IS NULL;
--> statement-breakpoint
UPDATE transactions
SET consolidation_parent_transaction_id = NULL
WHERE consolidation_parent_transaction_id IN (SELECT id FROM backfilled_atm_transfers);
--> statement-breakpoint
DELETE FROM transaction_tags WHERE transaction_id IN (SELECT id FROM backfilled_atm_transfers);
--> statement-breakpoint
DELETE FROM transaction_entries
WHERE transaction_id IN (SELECT id FROM backfilled_atm_transfers)
  AND original_transaction_id IS NULL;
--> statement-breakpoint
DELETE FROM transactions WHERE id IN (SELECT id FROM backfilled_atm_transfers);
--> statement-breakpoint
UPDATE transaction_entries
SET mcc_category_id = NULL,
    updated_at = unixepoch()
WHERE mcc_category_id = (SELECT id FROM mcc_categories WHERE mcc = '6011')
  AND type = 'CREDIT'
  AND category_source != 'FEE'
  AND created_at < (SELECT MIN(created_at) FROM mcc_categories)
  AND transaction_id IN (SELECT id FROM transactions WHERE external_source = 'MONOBANK' AND title LIKE 'Банкомат %');
--> statement-breakpoint
DROP TABLE backfilled_atm_transfers;
