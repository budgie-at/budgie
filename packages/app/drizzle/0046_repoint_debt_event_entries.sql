UPDATE debt_events
SET transaction_entry_id = (
        SELECT live_primary_entries.id
        FROM transaction_entries live_primary_entries
        WHERE live_primary_entries.transaction_id = debt_events.transaction_id
          AND live_primary_entries.kind = 'PRIMARY'
          AND live_primary_entries.type != 'FEE'
          AND live_primary_entries.deleted_at IS NULL
          AND live_primary_entries.original_transaction_id IS NULL
    ),
    updated_at = unixepoch()
WHERE debt_events.deleted_at IS NULL
  AND debt_events.source = 'INCOME_ATTACHMENT'
  AND debt_events.transaction_id IS NOT NULL
  AND (
      debt_events.transaction_entry_id IS NULL
      OR NOT EXISTS (
          SELECT 1
          FROM transaction_entries current_entry
          WHERE current_entry.id = debt_events.transaction_entry_id
            AND current_entry.deleted_at IS NULL
      )
  )
  AND (
      SELECT COUNT(*)
      FROM transaction_entries live_primary_entries
      WHERE live_primary_entries.transaction_id = debt_events.transaction_id
        AND live_primary_entries.kind = 'PRIMARY'
        AND live_primary_entries.type != 'FEE'
        AND live_primary_entries.deleted_at IS NULL
        AND live_primary_entries.original_transaction_id IS NULL
  ) = 1;
