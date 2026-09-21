DROP TABLE IF EXISTS debt_v2_transfer_leg_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_v2_transfer_leg_migration (
    transaction_id integer PRIMARY KEY NOT NULL,
    debt_account_id integer NOT NULL,
    debt_entry_id integer NOT NULL,
    funding_account_id integer NOT NULL,
    funding_entry_id integer NOT NULL,
    funding_entry_type text NOT NULL,
    debt_category_id integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_v2_transfer_leg_migration (
    transaction_id,
    debt_account_id,
    debt_entry_id,
    funding_account_id,
    funding_entry_id,
    funding_entry_type,
    debt_category_id
)
SELECT
    transactions.id,
    debt_accounts.id,
    debt_entries.id,
    funding_accounts.id,
    funding_entries.id,
    funding_entries.type,
    CASE WHEN debt_accounts.debt_type = 'LENT' THEN 100000 ELSE 100001 END
FROM transactions
INNER JOIN transaction_entries debt_entries
    ON debt_entries.transaction_id = transactions.id
    AND debt_entries.type IN ('DEBIT', 'CREDIT')
    AND debt_entries.deleted_at IS NULL
    AND debt_entries.original_transaction_id IS NULL
INNER JOIN accounts debt_accounts
    ON debt_accounts.id = debt_entries.account_id
    AND debt_accounts.type = 'DEBT'
    AND debt_accounts.deleted_at IS NULL
INNER JOIN transaction_entries funding_entries
    ON funding_entries.transaction_id = transactions.id
    AND funding_entries.type IN ('DEBIT', 'CREDIT')
    AND funding_entries.deleted_at IS NULL
    AND funding_entries.original_transaction_id IS NULL
INNER JOIN accounts funding_accounts
    ON funding_accounts.id = funding_entries.account_id
    AND funding_accounts.type != 'DEBT'
    AND funding_accounts.deleted_at IS NULL
WHERE transactions.type IN ('TRANSFER', 'DEBT')
  AND transactions.deleted_at IS NULL
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_debt_entries
      INNER JOIN accounts counted_debt_accounts
          ON counted_debt_accounts.id = counted_debt_entries.account_id
      WHERE counted_debt_entries.transaction_id = transactions.id
        AND counted_debt_entries.type IN ('DEBIT', 'CREDIT')
        AND counted_debt_entries.deleted_at IS NULL
        AND counted_debt_entries.original_transaction_id IS NULL
        AND counted_debt_accounts.type = 'DEBT'
  ) = 1
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_funding_entries
      INNER JOIN accounts counted_funding_accounts
          ON counted_funding_accounts.id = counted_funding_entries.account_id
      WHERE counted_funding_entries.transaction_id = transactions.id
        AND counted_funding_entries.type IN ('DEBIT', 'CREDIT')
        AND counted_funding_entries.deleted_at IS NULL
        AND counted_funding_entries.original_transaction_id IS NULL
        AND counted_funding_accounts.type != 'DEBT'
  ) = 1
  AND (
      SELECT COUNT(*)
      FROM categories
      WHERE categories.id IN (100000, 100001)
        AND categories.is_default = 1
        AND categories.is_system_category = 1
        AND categories.deleted_at IS NULL
  ) = 2;
--> statement-breakpoint
UPDATE transactions
SET type = (
        SELECT CASE WHEN candidates.funding_entry_type = 'CREDIT' THEN 'EXPENSE' ELSE 'INCOME' END
        FROM debt_v2_transfer_leg_migration candidates
        WHERE candidates.transaction_id = transactions.id
    ),
    from_account_id = (
        SELECT CASE WHEN candidates.funding_entry_type = 'CREDIT' THEN candidates.funding_account_id ELSE NULL END
        FROM debt_v2_transfer_leg_migration candidates
        WHERE candidates.transaction_id = transactions.id
    ),
    to_account_id = (
        SELECT CASE WHEN candidates.funding_entry_type = 'CREDIT' THEN NULL ELSE candidates.funding_account_id END
        FROM debt_v2_transfer_leg_migration candidates
        WHERE candidates.transaction_id = transactions.id
    ),
    updated_at = unixepoch()
WHERE transactions.id IN (SELECT transaction_id FROM debt_v2_transfer_leg_migration);
--> statement-breakpoint
UPDATE transaction_entries
SET category_id = (
        SELECT candidates.debt_category_id
        FROM debt_v2_transfer_leg_migration candidates
        WHERE candidates.funding_entry_id = transaction_entries.id
    ),
    category_source = 'DEBT_SETTLEMENT',
    updated_at = unixepoch()
WHERE transaction_entries.id IN (SELECT funding_entry_id FROM debt_v2_transfer_leg_migration)
  AND (transaction_entries.category_id IS NULL OR transaction_entries.category_id IN (7, 8, 9));
--> statement-breakpoint
UPDATE debt_events
SET transaction_entry_id = (
        SELECT candidates.funding_entry_id
        FROM debt_v2_transfer_leg_migration candidates
        WHERE candidates.transaction_id = debt_events.transaction_id
          AND candidates.debt_account_id = debt_events.debt_account_id
    ),
    source = CASE WHEN debt_events.direction = 'OPEN' THEN 'OPENING' ELSE debt_events.source END,
    updated_at = unixepoch()
WHERE debt_events.deleted_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM debt_v2_transfer_leg_migration candidates
      WHERE candidates.transaction_id = debt_events.transaction_id
        AND candidates.debt_account_id = debt_events.debt_account_id
  );
--> statement-breakpoint
UPDATE transaction_entries
SET deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE transaction_entries.id IN (SELECT debt_entry_id FROM debt_v2_transfer_leg_migration);
--> statement-breakpoint
DROP TABLE debt_v2_transfer_leg_migration;
--> statement-breakpoint
DROP TABLE IF EXISTS debt_v2_mirror_leg_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_v2_mirror_leg_migration (
    transaction_id integer PRIMARY KEY NOT NULL,
    debt_account_id integer NOT NULL,
    mirror_entry_id integer NOT NULL,
    funding_entry_id integer NOT NULL,
    debt_category_id integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_v2_mirror_leg_migration (
    transaction_id,
    debt_account_id,
    mirror_entry_id,
    funding_entry_id,
    debt_category_id
)
SELECT
    transactions.id,
    debt_accounts.id,
    mirror_entries.id,
    funding_entries.id,
    CASE WHEN debt_accounts.debt_type = 'LENT' THEN 100000 ELSE 100001 END
FROM transactions
INNER JOIN transaction_entries mirror_entries
    ON mirror_entries.transaction_id = transactions.id
    AND mirror_entries.kind = 'DEBT_SETTLEMENT'
    AND mirror_entries.deleted_at IS NULL
    AND mirror_entries.original_transaction_id IS NULL
INNER JOIN accounts debt_accounts
    ON debt_accounts.id = mirror_entries.account_id
    AND debt_accounts.type = 'DEBT'
    AND debt_accounts.deleted_at IS NULL
INNER JOIN transaction_entries funding_entries
    ON funding_entries.transaction_id = transactions.id
    AND funding_entries.kind = 'PRIMARY'
    AND funding_entries.type IN ('DEBIT', 'CREDIT')
    AND funding_entries.deleted_at IS NULL
    AND funding_entries.original_transaction_id IS NULL
INNER JOIN accounts funding_accounts
    ON funding_accounts.id = funding_entries.account_id
    AND funding_accounts.type != 'DEBT'
    AND funding_accounts.deleted_at IS NULL
WHERE transactions.type IN ('EXPENSE', 'INCOME')
  AND transactions.deleted_at IS NULL
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_mirror_entries
      INNER JOIN accounts counted_mirror_accounts
          ON counted_mirror_accounts.id = counted_mirror_entries.account_id
      WHERE counted_mirror_entries.transaction_id = transactions.id
        AND counted_mirror_entries.kind = 'DEBT_SETTLEMENT'
        AND counted_mirror_entries.deleted_at IS NULL
        AND counted_mirror_entries.original_transaction_id IS NULL
        AND counted_mirror_accounts.type = 'DEBT'
  ) = 1
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_funding_entries
      INNER JOIN accounts counted_funding_accounts
          ON counted_funding_accounts.id = counted_funding_entries.account_id
      WHERE counted_funding_entries.transaction_id = transactions.id
        AND counted_funding_entries.kind = 'PRIMARY'
        AND counted_funding_entries.type IN ('DEBIT', 'CREDIT')
        AND counted_funding_entries.deleted_at IS NULL
        AND counted_funding_entries.original_transaction_id IS NULL
        AND counted_funding_accounts.type != 'DEBT'
  ) = 1
  AND (
      SELECT COUNT(*)
      FROM categories
      WHERE categories.id IN (100000, 100001)
        AND categories.is_default = 1
        AND categories.is_system_category = 1
        AND categories.deleted_at IS NULL
  ) = 2;
--> statement-breakpoint
UPDATE transaction_entries
SET category_id = (
        SELECT candidates.debt_category_id
        FROM debt_v2_mirror_leg_migration candidates
        WHERE candidates.funding_entry_id = transaction_entries.id
    ),
    category_source = 'DEBT_SETTLEMENT',
    updated_at = unixepoch()
WHERE transaction_entries.id IN (SELECT funding_entry_id FROM debt_v2_mirror_leg_migration)
  AND (transaction_entries.category_id IS NULL OR transaction_entries.category_id IN (7, 8, 9, 17));
--> statement-breakpoint
UPDATE debt_events
SET transaction_entry_id = (
        SELECT candidates.funding_entry_id
        FROM debt_v2_mirror_leg_migration candidates
        WHERE candidates.transaction_id = debt_events.transaction_id
          AND candidates.debt_account_id = debt_events.debt_account_id
    ),
    updated_at = unixepoch()
WHERE debt_events.deleted_at IS NULL
  AND EXISTS (
      SELECT 1
      FROM debt_v2_mirror_leg_migration candidates
      WHERE candidates.transaction_id = debt_events.transaction_id
        AND candidates.debt_account_id = debt_events.debt_account_id
  );
--> statement-breakpoint
UPDATE transaction_entries
SET deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE transaction_entries.id IN (SELECT mirror_entry_id FROM debt_v2_mirror_leg_migration);
--> statement-breakpoint
DROP TABLE debt_v2_mirror_leg_migration;
--> statement-breakpoint
DROP TABLE IF EXISTS debt_v2_parked_adjustment_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_v2_parked_adjustment_migration (
    transaction_id integer PRIMARY KEY NOT NULL,
    adjustment_entry_id integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_v2_parked_adjustment_migration (transaction_id, adjustment_entry_id)
SELECT
    transactions.id,
    adjustment_entries.id
FROM transactions
INNER JOIN transaction_entries adjustment_entries
    ON adjustment_entries.transaction_id = transactions.id
    AND adjustment_entries.deleted_at IS NULL
    AND adjustment_entries.original_transaction_id IS NULL
INNER JOIN accounts adjustment_accounts
    ON adjustment_accounts.id = adjustment_entries.account_id
    AND adjustment_accounts.type = 'DEBT'
WHERE transactions.type = 'ADJUSTMENT'
  AND transactions.deleted_at IS NULL
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_entries
      WHERE counted_entries.transaction_id = transactions.id
        AND counted_entries.deleted_at IS NULL
        AND counted_entries.original_transaction_id IS NULL
  ) = 1
  AND NOT EXISTS (
      SELECT 1
      FROM debt_events parked_events
      WHERE parked_events.transaction_id = transactions.id
        AND parked_events.deleted_at IS NULL
  );
--> statement-breakpoint
UPDATE transactions
SET deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE transactions.id IN (SELECT transaction_id FROM debt_v2_parked_adjustment_migration);
--> statement-breakpoint
UPDATE transaction_entries
SET deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE transaction_entries.id IN (SELECT adjustment_entry_id FROM debt_v2_parked_adjustment_migration);
--> statement-breakpoint
DROP TABLE debt_v2_parked_adjustment_migration;
--> statement-breakpoint
DROP TABLE IF EXISTS debt_v2_ledger_balance_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_v2_ledger_balance_migration (
    account_id integer PRIMARY KEY NOT NULL,
    ledger_balance integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_v2_ledger_balance_migration (account_id, ledger_balance)
SELECT
    accounts.id,
    CASE accounts.debt_type WHEN 'LENT' THEN remaining.remaining_amount ELSE -remaining.remaining_amount END
FROM accounts
INNER JOIN (
    SELECT
        debt_accounts.id AS account_id,
        MAX(
            CASE
                WHEN opened_totals.opened_amount > 0 THEN opened_totals.opened_amount
                ELSE debt_accounts.target_balance
            END - closed_totals.closed_amount,
            0
        ) AS remaining_amount
    FROM accounts debt_accounts
    INNER JOIN (
        SELECT
            accounts_for_open.id AS account_id,
            COALESCE((
                SELECT SUM(opened_events.amount)
                FROM debt_events opened_events
                WHERE opened_events.debt_account_id = accounts_for_open.id
                  AND opened_events.deleted_at IS NULL
                  AND opened_events.direction = 'OPEN'
            ), 0) AS opened_amount
        FROM accounts accounts_for_open
        WHERE accounts_for_open.type = 'DEBT'
    ) opened_totals ON opened_totals.account_id = debt_accounts.id
    INNER JOIN (
        SELECT
            accounts_for_close.id AS account_id,
            COALESCE((
                SELECT SUM(closed_events.amount)
                FROM debt_events closed_events
                WHERE closed_events.debt_account_id = accounts_for_close.id
                  AND closed_events.deleted_at IS NULL
                  AND closed_events.direction = 'CLOSE'
            ), 0) AS closed_amount
        FROM accounts accounts_for_close
        WHERE accounts_for_close.type = 'DEBT'
    ) closed_totals ON closed_totals.account_id = debt_accounts.id
    WHERE debt_accounts.type = 'DEBT'
) remaining ON remaining.account_id = accounts.id
WHERE accounts.type = 'DEBT';
--> statement-breakpoint
UPDATE account_balances
SET amount = (
        SELECT rebuilt.ledger_balance
        FROM debt_v2_ledger_balance_migration rebuilt
        WHERE rebuilt.account_id = account_balances.account_id
    ),
    updated_at = unixepoch()
WHERE account_balances.deleted_at IS NULL
  AND account_balances.account_id IN (SELECT account_id FROM debt_v2_ledger_balance_migration)
  AND account_balances.amount != (
      SELECT rebuilt.ledger_balance
      FROM debt_v2_ledger_balance_migration rebuilt
      WHERE rebuilt.account_id = account_balances.account_id
  );
--> statement-breakpoint
DROP TABLE debt_v2_ledger_balance_migration;
