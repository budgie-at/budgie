ALTER TABLE transaction_entries ADD COLUMN kind text NOT NULL DEFAULT 'PRIMARY';
--> statement-breakpoint
CREATE TEMP TABLE debt_settlement_entry_kind_migration (
    transaction_id integer NOT NULL,
    cash_account_id integer NOT NULL,
    debt_account_id integer NOT NULL,
    transaction_type text NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_settlement_entry_kind_migration (transaction_id, cash_account_id, debt_account_id, transaction_type)
SELECT
    transactions.id,
    cash_entry.account_id,
    debt_entry.account_id,
    CASE
        WHEN debt_account.debt_type = 'LENT'
             AND cash_entry.type = 'DEBIT'
             AND debt_entry.type = 'CREDIT'
        THEN 'INCOME'
        WHEN debt_account.debt_type = 'BORROW'
             AND cash_entry.type = 'CREDIT'
             AND debt_entry.type = 'DEBIT'
        THEN 'EXPENSE'
    END
FROM transactions
INNER JOIN transaction_entries cash_entry
    ON cash_entry.transaction_id = transactions.id
    AND cash_entry.deleted_at IS NULL
    AND cash_entry.original_transaction_id IS NULL
INNER JOIN accounts cash_account
    ON cash_account.id = cash_entry.account_id
    AND cash_account.type != 'DEBT'
INNER JOIN transaction_entries debt_entry
    ON debt_entry.transaction_id = transactions.id
    AND debt_entry.deleted_at IS NULL
    AND debt_entry.original_transaction_id IS NULL
INNER JOIN accounts debt_account
    ON debt_account.id = debt_entry.account_id
    AND debt_account.type = 'DEBT'
WHERE transactions.type = 'DEBT'
  AND transactions.deleted_at IS NULL
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_entry
      WHERE counted_entry.transaction_id = transactions.id
        AND counted_entry.deleted_at IS NULL
        AND counted_entry.original_transaction_id IS NULL
  ) = 2
  AND (
      (debt_account.debt_type = 'LENT' AND cash_entry.type = 'DEBIT' AND debt_entry.type = 'CREDIT')
      OR (debt_account.debt_type = 'BORROW' AND cash_entry.type = 'CREDIT' AND debt_entry.type = 'DEBIT')
  );
--> statement-breakpoint
UPDATE transaction_entries
SET kind = 'DEBT_SETTLEMENT'
WHERE id IN (
    SELECT debt_entry.id
    FROM transaction_entries debt_entry
    INNER JOIN debt_settlement_entry_kind_migration migration
        ON migration.transaction_id = debt_entry.transaction_id
        AND migration.debt_account_id = debt_entry.account_id
);
--> statement-breakpoint
UPDATE transaction_entries
SET category_id = (
    SELECT primary_entry.category_id
    FROM transaction_entries primary_entry
    INNER JOIN debt_settlement_entry_kind_migration migration
        ON migration.transaction_id = primary_entry.transaction_id
        AND migration.cash_account_id = primary_entry.account_id
    WHERE primary_entry.transaction_id = transaction_entries.transaction_id
    LIMIT 1
),
category_source = (
    SELECT primary_entry.category_source
    FROM transaction_entries primary_entry
    INNER JOIN debt_settlement_entry_kind_migration migration
        ON migration.transaction_id = primary_entry.transaction_id
        AND migration.cash_account_id = primary_entry.account_id
    WHERE primary_entry.transaction_id = transaction_entries.transaction_id
    LIMIT 1
)
WHERE kind = 'DEBT_SETTLEMENT'
  AND transaction_id IN (
      SELECT transaction_id
      FROM debt_settlement_entry_kind_migration
  )
  AND category_id IS NULL;
--> statement-breakpoint
UPDATE transactions
SET type = (
    SELECT migration.transaction_type
    FROM debt_settlement_entry_kind_migration migration
    WHERE migration.transaction_id = transactions.id
),
from_account_id = CASE
    WHEN (
        SELECT migration.transaction_type
        FROM debt_settlement_entry_kind_migration migration
        WHERE migration.transaction_id = transactions.id
    ) = 'EXPENSE'
    THEN (
        SELECT migration.cash_account_id
        FROM debt_settlement_entry_kind_migration migration
        WHERE migration.transaction_id = transactions.id
    )
    ELSE NULL
END,
to_account_id = CASE
    WHEN (
        SELECT migration.transaction_type
        FROM debt_settlement_entry_kind_migration migration
        WHERE migration.transaction_id = transactions.id
    ) = 'INCOME'
    THEN (
        SELECT migration.cash_account_id
        FROM debt_settlement_entry_kind_migration migration
        WHERE migration.transaction_id = transactions.id
    )
    ELSE NULL
END,
exchange_rate = 1
WHERE id IN (
    SELECT transaction_id
    FROM debt_settlement_entry_kind_migration
);
--> statement-breakpoint
DROP TABLE debt_settlement_entry_kind_migration;
