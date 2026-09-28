UPDATE transaction_entries
SET category_id = (
        SELECT CASE debt_accounts.debt_type WHEN 'LENT' THEN 100000 ELSE 100001 END
        FROM debt_events
        INNER JOIN accounts debt_accounts ON debt_accounts.id = debt_events.debt_account_id
        WHERE debt_events.transaction_id = transaction_entries.transaction_id
          AND debt_events.deleted_at IS NULL
    ),
    category_source = 'DEBT_SETTLEMENT',
    updated_at = unixepoch()
WHERE transaction_entries.deleted_at IS NULL
  AND transaction_entries.original_transaction_id IS NULL
  AND transaction_entries.kind = 'PRIMARY'
  AND transaction_entries.type IN ('DEBIT', 'CREDIT')
  AND (
      transaction_entries.category_id IS NULL
      OR transaction_entries.category_id IN (7, 8, 9)
      OR (transaction_entries.category_id = 17 AND transaction_entries.category_source = 'DEBT_SETTLEMENT')
  )
  AND EXISTS (
      SELECT 1
      FROM transactions
      WHERE transactions.id = transaction_entries.transaction_id
        AND transactions.type IN ('EXPENSE', 'INCOME')
        AND transactions.deleted_at IS NULL
  )
  AND EXISTS (
      SELECT 1
      FROM accounts funding_accounts
      WHERE funding_accounts.id = transaction_entries.account_id
        AND funding_accounts.type != 'DEBT'
  )
  AND EXISTS (
      SELECT 1
      FROM debt_events
      INNER JOIN accounts debt_accounts ON debt_accounts.id = debt_events.debt_account_id
      WHERE debt_events.transaction_id = transaction_entries.transaction_id
        AND debt_events.deleted_at IS NULL
        AND debt_accounts.type = 'DEBT'
        AND debt_accounts.deleted_at IS NULL
  )
  AND NOT EXISTS (
      SELECT 1
      FROM transaction_entries sibling_entries
      WHERE sibling_entries.transaction_id = transaction_entries.transaction_id
        AND sibling_entries.id != transaction_entries.id
        AND sibling_entries.deleted_at IS NULL
        AND sibling_entries.original_transaction_id IS NULL
        AND sibling_entries.kind = 'PRIMARY'
        AND sibling_entries.type IN ('DEBIT', 'CREDIT')
  )
  AND (
      SELECT COUNT(*)
      FROM categories
      WHERE categories.id IN (100000, 100001)
        AND categories.is_system_category = 1
        AND categories.deleted_at IS NULL
  ) = 2;
--> statement-breakpoint
UPDATE transaction_entries
SET category_id = NULL,
    category_source = 'USER',
    updated_at = unixepoch()
WHERE transaction_entries.deleted_at IS NULL
  AND transaction_entries.category_id IN (7, 8, 9)
  AND transaction_entries.type IN ('DEBIT', 'CREDIT')
  AND EXISTS (
      SELECT 1
      FROM transactions
      WHERE transactions.id = transaction_entries.transaction_id
        AND transactions.type = 'TRANSFER'
  );
