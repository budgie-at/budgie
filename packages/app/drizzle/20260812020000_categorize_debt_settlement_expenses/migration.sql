UPDATE transaction_entries
SET category_id = 17,
    category_source = 'DEBT_SETTLEMENT'
WHERE category_id IS NULL
  AND kind = 'PRIMARY'
  AND deleted_at IS NULL
  AND original_transaction_id IS NULL
  AND EXISTS (
      SELECT 1
      FROM categories
      WHERE categories.id = 17
        AND categories.title = 'Debt Payments'
        AND categories.is_default = 1
        AND categories.deleted_at IS NULL
  )
  AND EXISTS (
      SELECT 1
      FROM debt_events
      INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id
      WHERE debt_events.transaction_entry_id = transaction_entries.id
        AND debt_events.deleted_at IS NULL
        AND debt_events.direction = 'CLOSE'
        AND transactions.type = 'EXPENSE'
        AND transactions.deleted_at IS NULL
  );
