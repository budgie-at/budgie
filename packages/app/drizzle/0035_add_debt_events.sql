CREATE TABLE `debt_events` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `created_at` integer DEFAULT (unixepoch()) NOT NULL,
    `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
    `deleted_at` integer,
    `debt_account_id` integer NOT NULL,
    `transaction_id` integer,
    `transaction_entry_id` integer,
    `direction` text NOT NULL,
    `source` text NOT NULL,
    `amount` integer NOT NULL,
    `base_instrument_id` integer,
    `base_exchange_rate` real,
    `base_amount` integer,
    `operated_at` integer DEFAULT (unixepoch()) NOT NULL,
    FOREIGN KEY (`debt_account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`transaction_id`) REFERENCES `transactions`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`transaction_entry_id`) REFERENCES `transaction_entries`(`id`) ON UPDATE no action ON DELETE set null,
    FOREIGN KEY (`base_instrument_id`) REFERENCES `instruments`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO debt_events (
    created_at,
    updated_at,
    deleted_at,
    debt_account_id,
    transaction_id,
    transaction_entry_id,
    direction,
    source,
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
)
SELECT
    debt_entry.created_at,
    debt_entry.updated_at,
    NULL,
    debt_entry.account_id,
    debt_entry.transaction_id,
    debt_entry.id,
    CASE
        WHEN debt_account.debt_type = 'LENT' AND debt_entry.type = 'CREDIT' THEN 'CLOSE'
        WHEN debt_account.debt_type = 'LENT' AND debt_entry.type = 'DEBIT' THEN 'OPEN'
        WHEN debt_account.debt_type = 'BORROW' AND debt_entry.type = 'CREDIT' THEN 'OPEN'
        WHEN debt_account.debt_type = 'BORROW' AND debt_entry.type = 'DEBIT' THEN 'CLOSE'
    END,
    'MIGRATION',
    debt_entry.amount,
    debt_entry.base_instrument_id,
    debt_entry.base_exchange_rate,
    debt_entry.base_amount,
    transactions.operated_at
FROM transaction_entries debt_entry
INNER JOIN accounts debt_account
    ON debt_account.id = debt_entry.account_id
    AND debt_account.type = 'DEBT'
    AND debt_account.deleted_at IS NULL
INNER JOIN transactions
    ON transactions.id = debt_entry.transaction_id
    AND transactions.deleted_at IS NULL
WHERE debt_entry.kind = 'DEBT_SETTLEMENT'
  AND debt_entry.deleted_at IS NULL
  AND debt_entry.original_transaction_id IS NULL
  AND (
      (debt_account.debt_type = 'LENT' AND debt_entry.type IN ('CREDIT', 'DEBIT'))
      OR (debt_account.debt_type = 'BORROW' AND debt_entry.type IN ('CREDIT', 'DEBIT'))
  )
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_debt_entry
      INNER JOIN accounts counted_debt_account
          ON counted_debt_account.id = counted_debt_entry.account_id
          AND counted_debt_account.type = 'DEBT'
          AND counted_debt_account.deleted_at IS NULL
      WHERE counted_debt_entry.transaction_id = debt_entry.transaction_id
        AND counted_debt_entry.kind = 'DEBT_SETTLEMENT'
        AND counted_debt_entry.deleted_at IS NULL
        AND counted_debt_entry.original_transaction_id IS NULL
        AND (
            (counted_debt_account.debt_type = 'LENT' AND counted_debt_entry.type IN ('CREDIT', 'DEBIT'))
            OR (counted_debt_account.debt_type = 'BORROW' AND counted_debt_entry.type IN ('CREDIT', 'DEBIT'))
        )
  ) = 1;
--> statement-breakpoint
INSERT INTO debt_events (
    created_at,
    updated_at,
    deleted_at,
    debt_account_id,
    transaction_id,
    transaction_entry_id,
    direction,
    source,
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
)
SELECT
    debt_entry.created_at,
    debt_entry.updated_at,
    NULL,
    debt_entry.account_id,
    debt_entry.transaction_id,
    debt_entry.id,
    CASE
        WHEN debt_account.debt_type = 'LENT' AND debt_entry.type = 'DEBIT' THEN 'OPEN'
        WHEN debt_account.debt_type = 'LENT' AND debt_entry.type = 'CREDIT' THEN 'CLOSE'
        WHEN debt_account.debt_type = 'BORROW' AND debt_entry.type = 'CREDIT' THEN 'OPEN'
        WHEN debt_account.debt_type = 'BORROW' AND debt_entry.type = 'DEBIT' THEN 'CLOSE'
    END,
    'TRANSFER',
    debt_entry.amount,
    debt_entry.base_instrument_id,
    debt_entry.base_exchange_rate,
    debt_entry.base_amount,
    transactions.operated_at
FROM transaction_entries debt_entry
INNER JOIN accounts debt_account
    ON debt_account.id = debt_entry.account_id
    AND debt_account.type = 'DEBT'
    AND debt_account.deleted_at IS NULL
INNER JOIN transactions
    ON transactions.id = debt_entry.transaction_id
    AND transactions.type = 'DEBT'
    AND transactions.deleted_at IS NULL
WHERE debt_entry.kind = 'PRIMARY'
  AND debt_entry.deleted_at IS NULL
  AND debt_entry.original_transaction_id IS NULL
  AND (
      (debt_account.debt_type = 'LENT' AND debt_entry.type IN ('DEBIT', 'CREDIT'))
      OR (debt_account.debt_type = 'BORROW' AND debt_entry.type IN ('CREDIT', 'DEBIT'))
  )
  AND (
      SELECT COUNT(*)
      FROM transaction_entries counted_debt_entry
      INNER JOIN accounts counted_debt_account
          ON counted_debt_account.id = counted_debt_entry.account_id
          AND counted_debt_account.type = 'DEBT'
          AND counted_debt_account.deleted_at IS NULL
      WHERE counted_debt_entry.transaction_id = debt_entry.transaction_id
        AND counted_debt_entry.kind = 'PRIMARY'
        AND counted_debt_entry.deleted_at IS NULL
        AND counted_debt_entry.original_transaction_id IS NULL
        AND (
            (counted_debt_account.debt_type = 'LENT' AND counted_debt_entry.type IN ('DEBIT', 'CREDIT'))
            OR (counted_debt_account.debt_type = 'BORROW' AND counted_debt_entry.type IN ('CREDIT', 'DEBIT'))
        )
  ) = 1
  AND NOT EXISTS (
      SELECT 1
      FROM debt_events existing_event
      WHERE existing_event.transaction_id = debt_entry.transaction_id
        AND existing_event.deleted_at IS NULL
  );
--> statement-breakpoint
CREATE TEMP TABLE debt_event_manual_closing_migration (
    account_id integer NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    amount integer NOT NULL,
    base_instrument_id integer,
    base_exchange_rate real,
    base_amount integer,
    operated_at integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_event_manual_closing_migration (
    account_id,
    created_at,
    updated_at,
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
)
SELECT
    account_id,
    created_at,
    updated_at,
    amount,
    base_instrument_id,
    base_exchange_rate,
    CASE
        WHEN base_exchange_rate IS NOT NULL THEN CAST(ROUND(amount * base_exchange_rate) AS integer)
        ELSE NULL
    END,
    operated_at
FROM (
    SELECT
        accounts.id AS account_id,
        accounts.created_at AS created_at,
        accounts.updated_at AS updated_at,
        accounts.target_base_instrument_id AS base_instrument_id,
        accounts.target_base_exchange_rate AS base_exchange_rate,
        accounts.created_at AS operated_at,
        CASE
            WHEN accounts.debt_type = 'LENT' THEN MIN(MAX(COALESCE(SUM(CASE
                WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'DEBIT' THEN transaction_entries.amount
                WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'CREDIT' THEN 0 - transaction_entries.amount
                ELSE 0
            END), 0), 0), accounts.target_balance)
            WHEN accounts.debt_type = 'BORROW' THEN MIN(MAX(CASE
                WHEN COALESCE(SUM(CASE
                    WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'DEBIT' THEN transaction_entries.amount
                    WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'CREDIT' THEN 0 - transaction_entries.amount
                    ELSE 0
                END), 0) < 0 THEN accounts.target_balance + COALESCE(SUM(CASE
                    WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'DEBIT' THEN transaction_entries.amount
                    WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'CREDIT' THEN 0 - transaction_entries.amount
                    ELSE 0
                END), 0)
                ELSE COALESCE(SUM(CASE
                    WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'DEBIT' THEN transaction_entries.amount
                    WHEN transactions.id IS NOT NULL AND transaction_entries.type = 'CREDIT' THEN 0 - transaction_entries.amount
                    ELSE 0
                END), 0)
            END, 0), accounts.target_balance)
            ELSE 0
        END AS amount
    FROM accounts
    LEFT JOIN transaction_entries
        ON transaction_entries.account_id = accounts.id
        AND transaction_entries.kind = 'PRIMARY'
        AND transaction_entries.deleted_at IS NULL
        AND transaction_entries.original_transaction_id IS NULL
    LEFT JOIN transactions
        ON transactions.id = transaction_entries.transaction_id
        AND transactions.type = 'ADJUSTMENT'
        AND transactions.deleted_at IS NULL
    WHERE accounts.type = 'DEBT'
      AND accounts.target_balance > 0
      AND accounts.deleted_at IS NULL
    GROUP BY accounts.id
)
WHERE amount > 0;
--> statement-breakpoint
INSERT INTO debt_events (
    created_at,
    updated_at,
    deleted_at,
    debt_account_id,
    transaction_id,
    transaction_entry_id,
    direction,
    source,
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
)
SELECT
    created_at,
    updated_at,
    NULL,
    account_id,
    NULL,
    NULL,
    'CLOSE',
    'MANUAL',
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
FROM debt_event_manual_closing_migration;
--> statement-breakpoint
DROP TABLE debt_event_manual_closing_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_event_manual_opening_migration (
    account_id integer NOT NULL,
    created_at integer NOT NULL,
    updated_at integer NOT NULL,
    amount integer NOT NULL,
    base_instrument_id integer,
    base_exchange_rate real,
    base_amount integer,
    operated_at integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_event_manual_opening_migration (
    account_id,
    created_at,
    updated_at,
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
)
SELECT
    accounts.id,
    accounts.created_at,
    accounts.updated_at,
    accounts.target_balance - COALESCE(SUM(CASE WHEN debt_events.direction = 'OPEN' THEN debt_events.amount ELSE 0 END), 0),
    accounts.target_base_instrument_id,
    accounts.target_base_exchange_rate,
    CASE
        WHEN accounts.target_base_amount IS NOT NULL
             AND accounts.target_base_amount > COALESCE(SUM(CASE WHEN debt_events.direction = 'OPEN' THEN debt_events.base_amount ELSE 0 END), 0)
        THEN accounts.target_base_amount - COALESCE(SUM(CASE WHEN debt_events.direction = 'OPEN' THEN debt_events.base_amount ELSE 0 END), 0)
        ELSE NULL
    END,
    accounts.created_at
FROM accounts
LEFT JOIN debt_events
    ON debt_events.debt_account_id = accounts.id
    AND debt_events.deleted_at IS NULL
WHERE accounts.type = 'DEBT'
  AND accounts.target_balance > 0
  AND accounts.deleted_at IS NULL
GROUP BY accounts.id
HAVING accounts.target_balance > COALESCE(SUM(CASE WHEN debt_events.direction = 'OPEN' THEN debt_events.amount ELSE 0 END), 0);
--> statement-breakpoint
INSERT INTO debt_events (
    created_at,
    updated_at,
    deleted_at,
    debt_account_id,
    transaction_id,
    transaction_entry_id,
    direction,
    source,
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
)
SELECT
    created_at,
    updated_at,
    NULL,
    account_id,
    NULL,
    NULL,
    'OPEN',
    'MANUAL',
    amount,
    base_instrument_id,
    base_exchange_rate,
    base_amount,
    operated_at
FROM debt_event_manual_opening_migration
WHERE amount > 0;
--> statement-breakpoint
DROP TABLE debt_event_manual_opening_migration;
--> statement-breakpoint
UPDATE transaction_entries
SET deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE kind = 'DEBT_SETTLEMENT'
  AND deleted_at IS NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX `debt_events_live_transaction_unq`
ON `debt_events` (`transaction_id`)
WHERE `transaction_id` IS NOT NULL AND `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX `debt_events_transaction_idx`
ON `debt_events` (`transaction_id`)
WHERE `transaction_id` IS NOT NULL AND `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX `debt_events_transaction_entry_idx`
ON `debt_events` (`transaction_entry_id`)
WHERE `transaction_entry_id` IS NOT NULL AND `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX `debt_events_account_transaction_idx`
ON `debt_events` (`debt_account_id`, `transaction_id`)
WHERE `deleted_at` IS NULL;
--> statement-breakpoint
CREATE INDEX `debt_events_account_operated_idx`
ON `debt_events` (`debt_account_id`, `operated_at`)
WHERE `deleted_at` IS NULL;
