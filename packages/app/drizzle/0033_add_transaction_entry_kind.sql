ALTER TABLE transaction_entries ADD COLUMN kind text NOT NULL DEFAULT 'PRIMARY';
--> statement-breakpoint
CREATE TEMP TABLE borrowed_debt_transfer_direction_migration (
    transaction_id integer NOT NULL,
    cash_account_id integer NOT NULL,
    debt_account_id integer NOT NULL,
    new_from_account_id integer,
    new_to_account_id integer
);
--> statement-breakpoint
INSERT INTO borrowed_debt_transfer_direction_migration (
    transaction_id,
    cash_account_id,
    debt_account_id,
    new_from_account_id,
    new_to_account_id
)
SELECT
    transactions.id,
    cash_entry.account_id,
    debt_entry.account_id,
    CASE
        WHEN transactions.from_account_id = cash_entry.account_id THEN debt_entry.account_id
        WHEN transactions.from_account_id = debt_entry.account_id THEN cash_entry.account_id
        ELSE transactions.from_account_id
    END,
    CASE
        WHEN transactions.to_account_id = cash_entry.account_id THEN debt_entry.account_id
        WHEN transactions.to_account_id = debt_entry.account_id THEN cash_entry.account_id
        ELSE transactions.to_account_id
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
    AND debt_account.debt_type = 'BORROW'
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
      (cash_entry.type = 'CREDIT' AND debt_entry.type = 'DEBIT')
      OR (cash_entry.type = 'DEBIT' AND debt_entry.type = 'CREDIT')
  );
--> statement-breakpoint
UPDATE transaction_entries
SET type = CASE
    WHEN type = 'CREDIT' THEN 'DEBIT'
    ELSE 'CREDIT'
END
WHERE id IN (
    SELECT entry.id
    FROM transaction_entries entry
    INNER JOIN borrowed_debt_transfer_direction_migration migration
        ON migration.transaction_id = entry.transaction_id
        AND entry.account_id IN (migration.cash_account_id, migration.debt_account_id)
);
--> statement-breakpoint
UPDATE transactions
SET from_account_id = (
    SELECT migration.new_from_account_id
    FROM borrowed_debt_transfer_direction_migration migration
    WHERE migration.transaction_id = transactions.id
),
to_account_id = (
    SELECT migration.new_to_account_id
    FROM borrowed_debt_transfer_direction_migration migration
    WHERE migration.transaction_id = transactions.id
)
WHERE id IN (
    SELECT transaction_id
    FROM borrowed_debt_transfer_direction_migration
);
--> statement-breakpoint
DROP TABLE borrowed_debt_transfer_direction_migration;
--> statement-breakpoint
CREATE TEMP TABLE borrowed_debt_adjustment_direction_migration (
    transaction_id integer NOT NULL,
    debt_account_id integer NOT NULL,
    entry_type text NOT NULL
);
--> statement-breakpoint
INSERT INTO borrowed_debt_adjustment_direction_migration (transaction_id, debt_account_id, entry_type)
SELECT
    transactions.id,
    transaction_entries.account_id,
    transaction_entries.type
FROM transactions
INNER JOIN transaction_entries
    ON transaction_entries.transaction_id = transactions.id
    AND transaction_entries.deleted_at IS NULL
    AND transaction_entries.original_transaction_id IS NULL
INNER JOIN accounts
    ON accounts.id = transaction_entries.account_id
    AND accounts.type = 'DEBT'
    AND accounts.debt_type = 'BORROW'
WHERE transactions.type = 'ADJUSTMENT'
  AND transactions.deleted_at IS NULL
  AND transaction_entries.kind = 'PRIMARY'
  AND transaction_entries.type IN ('DEBIT', 'CREDIT');
--> statement-breakpoint
UPDATE transaction_entries
SET type = CASE
    WHEN type = 'CREDIT' THEN 'DEBIT'
    ELSE 'CREDIT'
END
WHERE id IN (
    SELECT transaction_entries.id
    FROM transaction_entries
    INNER JOIN borrowed_debt_adjustment_direction_migration migration
        ON migration.transaction_id = transaction_entries.transaction_id
        AND migration.debt_account_id = transaction_entries.account_id
);
--> statement-breakpoint
UPDATE transactions
SET from_account_id = CASE
    WHEN (
        SELECT migration.entry_type
        FROM borrowed_debt_adjustment_direction_migration migration
        WHERE migration.transaction_id = transactions.id
    ) = 'DEBIT'
    THEN (
        SELECT migration.debt_account_id
        FROM borrowed_debt_adjustment_direction_migration migration
        WHERE migration.transaction_id = transactions.id
    )
    ELSE NULL
END,
to_account_id = CASE
    WHEN (
        SELECT migration.entry_type
        FROM borrowed_debt_adjustment_direction_migration migration
        WHERE migration.transaction_id = transactions.id
    ) = 'CREDIT'
    THEN (
        SELECT migration.debt_account_id
        FROM borrowed_debt_adjustment_direction_migration migration
        WHERE migration.transaction_id = transactions.id
    )
    ELSE NULL
END
WHERE id IN (
    SELECT transaction_id
    FROM borrowed_debt_adjustment_direction_migration
);
--> statement-breakpoint
UPDATE account_balances
SET amount = 0 - amount
WHERE account_id IN (
    SELECT accounts.id
    FROM accounts
    WHERE accounts.type = 'DEBT'
      AND accounts.debt_type = 'BORROW'
);
--> statement-breakpoint
DROP TABLE borrowed_debt_adjustment_direction_migration;
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
