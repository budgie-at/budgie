DROP TABLE IF EXISTS eligible_borrowed_debt_accounts_migration;
--> statement-breakpoint
CREATE TEMP TABLE eligible_borrowed_debt_accounts_migration (
    account_id integer PRIMARY KEY NOT NULL,
    signed_adjustment_amount integer NOT NULL,
    manual_event_id integer NOT NULL,
    adjustment_transaction_id integer UNIQUE NOT NULL,
    adjustment_entry_id integer UNIQUE NOT NULL
);
--> statement-breakpoint
INSERT INTO eligible_borrowed_debt_accounts_migration (
    account_id,
    signed_adjustment_amount,
    manual_event_id,
    adjustment_transaction_id,
    adjustment_entry_id
)
SELECT
    accounts.id,
    SUM(CASE
        WHEN adjustment_entries.type = 'DEBIT' THEN adjustment_entries.amount
        WHEN adjustment_entries.type = 'CREDIT' THEN 0 - adjustment_entries.amount
        ELSE 0
    END),
    manual_events.id,
    MIN(adjustment_transactions.id),
    MIN(adjustment_entries.id)
FROM accounts
INNER JOIN transaction_entries adjustment_entries
    ON adjustment_entries.account_id = accounts.id
    AND adjustment_entries.kind = 'PRIMARY'
    AND adjustment_entries.deleted_at IS NULL
    AND adjustment_entries.original_transaction_id IS NULL
INNER JOIN transactions adjustment_transactions
    ON adjustment_transactions.id = adjustment_entries.transaction_id
    AND adjustment_transactions.type = 'ADJUSTMENT'
    AND adjustment_transactions.deleted_at IS NULL
    AND (
        SELECT COUNT(*)
        FROM transaction_entries live_non_original_entries
        WHERE live_non_original_entries.transaction_id = adjustment_transactions.id
          AND live_non_original_entries.deleted_at IS NULL
          AND live_non_original_entries.original_transaction_id IS NULL
    ) = 1
INNER JOIN debt_events manual_events
    ON manual_events.debt_account_id = accounts.id
    AND manual_events.transaction_id IS NULL
    AND manual_events.transaction_entry_id IS NULL
    AND manual_events.direction = 'CLOSE'
    AND manual_events.source = 'MANUAL'
    AND manual_events.deleted_at IS NULL
    AND manual_events.created_at = accounts.created_at
    AND manual_events.updated_at = accounts.updated_at
    AND manual_events.operated_at = accounts.created_at
    AND manual_events.base_instrument_id IS accounts.target_base_instrument_id
    AND manual_events.base_exchange_rate IS accounts.target_base_exchange_rate
WHERE accounts.type = 'DEBT'
  AND accounts.debt_type = 'BORROW'
  AND accounts.target_balance > 0
  AND accounts.deleted_at IS NULL
  AND (
      SELECT COUNT(*)
      FROM account_balances
      WHERE account_balances.account_id = accounts.id
        AND account_balances.deleted_at IS NULL
  ) <= 1
  AND (
      NOT EXISTS (
          SELECT 1
          FROM account_balances
          WHERE account_balances.account_id = accounts.id
            AND account_balances.deleted_at IS NULL
      )
      OR EXISTS (
          SELECT 1
          FROM account_balances
          WHERE account_balances.account_id = accounts.id
            AND account_balances.deleted_at IS NULL
            AND account_balances.amount = (
                SELECT SUM(CASE
                    WHEN balance_adjustment_entries.type = 'DEBIT' THEN balance_adjustment_entries.amount
                    WHEN balance_adjustment_entries.type = 'CREDIT' THEN 0 - balance_adjustment_entries.amount
                    ELSE 0
                END)
                FROM transaction_entries balance_adjustment_entries
                INNER JOIN transactions balance_adjustment_transactions
                    ON balance_adjustment_transactions.id = balance_adjustment_entries.transaction_id
                    AND balance_adjustment_transactions.type = 'ADJUSTMENT'
                    AND balance_adjustment_transactions.deleted_at IS NULL
                WHERE balance_adjustment_entries.account_id = accounts.id
                  AND balance_adjustment_entries.kind = 'PRIMARY'
                  AND balance_adjustment_entries.deleted_at IS NULL
                  AND balance_adjustment_entries.original_transaction_id IS NULL
            )
      )
  )
  AND (
      SELECT COUNT(*)
      FROM debt_events counted_manual_events
      WHERE counted_manual_events.debt_account_id = accounts.id
        AND counted_manual_events.transaction_id IS NULL
        AND counted_manual_events.transaction_entry_id IS NULL
        AND counted_manual_events.direction = 'CLOSE'
        AND counted_manual_events.source = 'MANUAL'
        AND counted_manual_events.created_at = accounts.created_at
        AND counted_manual_events.updated_at = accounts.updated_at
        AND counted_manual_events.operated_at = accounts.created_at
        AND counted_manual_events.base_instrument_id IS accounts.target_base_instrument_id
        AND counted_manual_events.base_exchange_rate IS accounts.target_base_exchange_rate
        AND counted_manual_events.deleted_at IS NULL
  ) = 1
  AND EXISTS (
      SELECT 1
      FROM debt_events transaction_backed_events
      INNER JOIN transactions transaction_backed_transactions
          ON transaction_backed_transactions.id = transaction_backed_events.transaction_id
          AND transaction_backed_transactions.created_at < 1781257200
          AND transaction_backed_transactions.deleted_at IS NULL
      INNER JOIN transaction_entries transaction_backed_entries
          ON transaction_backed_entries.id = transaction_backed_events.transaction_entry_id
          AND transaction_backed_entries.transaction_id = transaction_backed_transactions.id
          AND transaction_backed_entries.created_at < 1781257200
          AND transaction_backed_entries.original_transaction_id IS NULL
      WHERE transaction_backed_events.debt_account_id = accounts.id
        AND transaction_backed_events.transaction_id IS NOT NULL
        AND transaction_backed_events.transaction_entry_id IS NOT NULL
        AND transaction_backed_events.created_at < 1781257200
        AND transaction_backed_events.deleted_at IS NULL
        AND (
            (
                transaction_backed_events.source = 'MIGRATION'
                AND transaction_backed_entries.kind IN ('PRIMARY', 'DEBT_SETTLEMENT')
            )
            OR (
                transaction_backed_events.source = 'TRANSFER'
                AND transaction_backed_transactions.type = 'DEBT'
                AND transaction_backed_entries.kind = 'PRIMARY'
            )
        )
  )
GROUP BY accounts.id, manual_events.id
HAVING COUNT(*) = 1
   AND SUM(CASE
       WHEN adjustment_entries.type = 'DEBIT' THEN adjustment_entries.amount
       WHEN adjustment_entries.type = 'CREDIT' THEN 0 - adjustment_entries.amount
       ELSE 0
   END) < 0
   AND SUM(CASE
       WHEN adjustment_entries.type = 'DEBIT'
            AND adjustment_transactions.to_account_id = accounts.id
            AND adjustment_transactions.from_account_id IS NULL
       THEN 0
       WHEN adjustment_entries.type = 'CREDIT'
            AND adjustment_transactions.from_account_id = accounts.id
            AND adjustment_transactions.to_account_id IS NULL
       THEN 0
       ELSE 1
   END) = 0
   AND accounts.target_balance + SUM(CASE
       WHEN adjustment_entries.type = 'DEBIT' THEN adjustment_entries.amount
       WHEN adjustment_entries.type = 'CREDIT' THEN 0 - adjustment_entries.amount
       ELSE 0
   END) > 0
   AND manual_events.amount = accounts.target_balance + SUM(CASE
       WHEN adjustment_entries.type = 'DEBIT' THEN adjustment_entries.amount
       WHEN adjustment_entries.type = 'CREDIT' THEN 0 - adjustment_entries.amount
       ELSE 0
   END)
   AND (
       manual_events.base_amount IS NULL
       OR (
           manual_events.base_exchange_rate IS NOT NULL
           AND manual_events.base_amount = CAST(ROUND(manual_events.amount * manual_events.base_exchange_rate) AS integer)
       )
   );
--> statement-breakpoint
DROP TABLE IF EXISTS borrowed_debt_transaction_candidates_migration;
--> statement-breakpoint
CREATE TEMP TABLE borrowed_debt_transaction_candidates_migration (
    transaction_id integer PRIMARY KEY NOT NULL,
    debt_account_id integer NOT NULL,
    cash_account_id integer NOT NULL,
    cash_entry_id integer NOT NULL,
    debt_entry_id integer NOT NULL,
    existing_event_id integer,
    debt_entry_created_at integer NOT NULL,
    debt_entry_updated_at integer NOT NULL,
    debt_entry_amount integer NOT NULL,
    debt_entry_base_instrument_id integer,
    debt_entry_base_exchange_rate real,
    debt_entry_base_amount integer,
    transaction_operated_at integer NOT NULL
);
--> statement-breakpoint
INSERT INTO borrowed_debt_transaction_candidates_migration (
    transaction_id,
    debt_account_id,
    cash_account_id,
    cash_entry_id,
    debt_entry_id,
    existing_event_id,
    debt_entry_created_at,
    debt_entry_updated_at,
    debt_entry_amount,
    debt_entry_base_instrument_id,
    debt_entry_base_exchange_rate,
    debt_entry_base_amount,
    transaction_operated_at
)
SELECT
    transactions.id,
    eligible_accounts.account_id,
    cash_accounts.id,
    cash_entries.id,
    debt_entries.id,
    existing_events.id,
    debt_entries.created_at,
    debt_entries.updated_at,
    debt_entries.amount,
    debt_entries.base_instrument_id,
    debt_entries.base_exchange_rate,
    debt_entries.base_amount,
    transactions.operated_at
FROM eligible_borrowed_debt_accounts_migration eligible_accounts
INNER JOIN transactions
    ON transactions.type = 'DEBT'
    AND transactions.from_account_id = eligible_accounts.account_id
    AND transactions.to_account_id IS NOT NULL
    AND transactions.exchange_rate = 1
    AND transactions.created_at < 1781257200
    AND transactions.deleted_at IS NULL
INNER JOIN accounts cash_accounts
    ON cash_accounts.id = transactions.to_account_id
    AND cash_accounts.type != 'DEBT'
    AND cash_accounts.deleted_at IS NULL
INNER JOIN transaction_entries cash_entries
    ON cash_entries.transaction_id = transactions.id
    AND cash_entries.account_id = cash_accounts.id
    AND cash_entries.type = 'DEBIT'
    AND cash_entries.kind = 'PRIMARY'
    AND cash_entries.category_id IS NOT NULL
    AND cash_entries.category_source IS NOT NULL
    AND cash_entries.created_at < 1781257200
    AND cash_entries.deleted_at IS NULL
    AND cash_entries.original_transaction_id IS NULL
INNER JOIN transaction_entries debt_entries
    ON debt_entries.transaction_id = transactions.id
    AND debt_entries.account_id = eligible_accounts.account_id
    AND debt_entries.type = 'CREDIT'
    AND debt_entries.kind = 'PRIMARY'
    AND debt_entries.category_id IS NULL
    AND debt_entries.created_at < 1781257200
    AND debt_entries.deleted_at IS NULL
    AND debt_entries.original_transaction_id IS NULL
LEFT JOIN (
    SELECT ranked_events.id,
           ranked_events.transaction_id,
           ranked_events.debt_account_id,
           ranked_events.transaction_entry_id,
           ranked_events.amount,
           ranked_events.base_instrument_id,
           ranked_events.base_exchange_rate,
           ranked_events.base_amount,
           ranked_events.created_at,
           ranked_events.updated_at,
           ranked_events.operated_at
    FROM (
        SELECT matching_events.id,
               matching_events.transaction_id,
               matching_events.debt_account_id,
               matching_events.transaction_entry_id,
               matching_events.amount,
               matching_events.base_instrument_id,
               matching_events.base_exchange_rate,
               matching_events.base_amount,
               matching_events.created_at,
               matching_events.updated_at,
               matching_events.operated_at,
               ROW_NUMBER() OVER (
                   PARTITION BY matching_events.debt_account_id,
                                matching_events.transaction_id,
                                matching_events.transaction_entry_id
                   ORDER BY CASE
                       WHEN matching_events.source = 'MIGRATION' THEN 0
                       ELSE 1
                   END,
                   matching_events.id
               ) AS event_rank
        FROM debt_events matching_events
        WHERE matching_events.deleted_at IS NULL
          AND matching_events.created_at < 1781257200
          AND (
              (matching_events.direction = 'OPEN' AND matching_events.source = 'TRANSFER')
              OR (matching_events.direction = 'CLOSE' AND matching_events.source = 'MIGRATION')
          )
    ) ranked_events
    WHERE ranked_events.event_rank = 1
) existing_events
    ON existing_events.transaction_id = transactions.id
    AND existing_events.debt_account_id = eligible_accounts.account_id
    AND existing_events.transaction_entry_id = debt_entries.id
    AND existing_events.amount = debt_entries.amount
    AND existing_events.base_instrument_id IS debt_entries.base_instrument_id
    AND existing_events.base_exchange_rate IS debt_entries.base_exchange_rate
    AND existing_events.base_amount IS debt_entries.base_amount
    AND existing_events.created_at = debt_entries.created_at
    AND existing_events.updated_at = debt_entries.updated_at
    AND existing_events.operated_at = transactions.operated_at
WHERE (
      SELECT COUNT(*)
      FROM transaction_entries counted_entries
      WHERE counted_entries.transaction_id = transactions.id
        AND counted_entries.deleted_at IS NULL
        AND counted_entries.original_transaction_id IS NULL
  ) = 2
  AND (
      NOT EXISTS (
          SELECT 1
          FROM debt_events live_events
          WHERE live_events.transaction_id = transactions.id
            AND live_events.deleted_at IS NULL
      )
      OR existing_events.id IS NOT NULL
  );
--> statement-breakpoint
UPDATE debt_events
SET deleted_at = 1784131200,
    updated_at = 1784131200
WHERE debt_events.id IN (
    SELECT duplicate_events.id
    FROM borrowed_debt_transaction_candidates_migration candidates
    INNER JOIN debt_events canonical_events
        ON canonical_events.id = candidates.existing_event_id
    INNER JOIN debt_events duplicate_events
        ON duplicate_events.id != canonical_events.id
        AND duplicate_events.transaction_id = candidates.transaction_id
        AND duplicate_events.debt_account_id = candidates.debt_account_id
        AND duplicate_events.transaction_entry_id = candidates.debt_entry_id
        AND duplicate_events.amount = candidates.debt_entry_amount
        AND duplicate_events.base_instrument_id IS candidates.debt_entry_base_instrument_id
        AND duplicate_events.base_exchange_rate IS candidates.debt_entry_base_exchange_rate
        AND duplicate_events.base_amount IS candidates.debt_entry_base_amount
        AND duplicate_events.created_at < 1781257200
        AND duplicate_events.deleted_at IS NULL
        AND (
            (duplicate_events.direction = 'OPEN' AND duplicate_events.source = 'TRANSFER')
            OR (duplicate_events.direction = 'CLOSE' AND duplicate_events.source = 'MIGRATION')
        )
    WHERE candidates.existing_event_id IS NOT NULL
);
--> statement-breakpoint
DROP TABLE IF EXISTS borrowed_debt_manual_open_candidates_migration;
--> statement-breakpoint
CREATE TEMP TABLE borrowed_debt_manual_open_candidates_migration (
    event_id integer PRIMARY KEY NOT NULL,
    target_amount integer NOT NULL
);
--> statement-breakpoint
INSERT INTO borrowed_debt_manual_open_candidates_migration (event_id, target_amount)
SELECT
    manual_open_events.id,
    accounts.target_balance
FROM borrowed_debt_transaction_candidates_migration candidates
INNER JOIN accounts
    ON accounts.id = candidates.debt_account_id
INNER JOIN debt_events manual_open_events
    ON manual_open_events.debt_account_id = candidates.debt_account_id
    AND manual_open_events.transaction_id IS NULL
    AND manual_open_events.transaction_entry_id IS NULL
    AND manual_open_events.direction = 'OPEN'
    AND manual_open_events.source = 'MANUAL'
    AND manual_open_events.amount = accounts.target_balance - candidates.debt_entry_amount
    AND manual_open_events.base_instrument_id IS accounts.target_base_instrument_id
    AND manual_open_events.base_exchange_rate IS accounts.target_base_exchange_rate
    AND manual_open_events.created_at = accounts.created_at
    AND manual_open_events.updated_at = accounts.updated_at
    AND manual_open_events.operated_at = accounts.created_at
    AND manual_open_events.deleted_at IS NULL
WHERE (
      SELECT COUNT(*)
      FROM borrowed_debt_transaction_candidates_migration counted_candidates
      WHERE counted_candidates.debt_account_id = candidates.debt_account_id
  ) = 1
  AND (
      SELECT COUNT(*)
      FROM debt_events counted_manual_open_events
      WHERE counted_manual_open_events.debt_account_id = candidates.debt_account_id
        AND counted_manual_open_events.transaction_id IS NULL
        AND counted_manual_open_events.transaction_entry_id IS NULL
        AND counted_manual_open_events.direction = 'OPEN'
        AND counted_manual_open_events.source = 'MANUAL'
        AND counted_manual_open_events.deleted_at IS NULL
  ) = 1
  AND (
      manual_open_events.base_amount IS NULL
      OR (
          manual_open_events.base_exchange_rate IS NOT NULL
          AND manual_open_events.base_amount = CAST(ROUND(
              manual_open_events.amount * manual_open_events.base_exchange_rate
          ) AS integer)
      )
  );
--> statement-breakpoint
UPDATE debt_events
SET amount = 0 - (
        SELECT eligible_accounts.signed_adjustment_amount
        FROM eligible_borrowed_debt_accounts_migration eligible_accounts
        WHERE eligible_accounts.manual_event_id = debt_events.id
    ),
    base_amount = CASE
        WHEN debt_events.base_exchange_rate IS NOT NULL AND debt_events.base_amount IS NOT NULL
        THEN CAST(ROUND((0 - (
            SELECT eligible_accounts.signed_adjustment_amount
            FROM eligible_borrowed_debt_accounts_migration eligible_accounts
            WHERE eligible_accounts.manual_event_id = debt_events.id
        )) * debt_events.base_exchange_rate) AS integer)
        ELSE debt_events.base_amount
    END
WHERE debt_events.id IN (
    SELECT eligible_accounts.manual_event_id
    FROM eligible_borrowed_debt_accounts_migration eligible_accounts
);
--> statement-breakpoint
UPDATE transactions
SET deleted_at = 1784131200,
    updated_at = 1784131200
WHERE transactions.id IN (
    SELECT eligible_accounts.adjustment_transaction_id
    FROM eligible_borrowed_debt_accounts_migration eligible_accounts
);
--> statement-breakpoint
UPDATE transaction_entries
SET deleted_at = 1784131200,
    updated_at = 1784131200
WHERE transaction_entries.id IN (
    SELECT eligible_accounts.adjustment_entry_id
    FROM eligible_borrowed_debt_accounts_migration eligible_accounts
);
--> statement-breakpoint
UPDATE debt_events
SET amount = (
        SELECT candidates.target_amount
        FROM borrowed_debt_manual_open_candidates_migration candidates
        WHERE candidates.event_id = debt_events.id
    ),
    base_amount = CASE
        WHEN debt_events.base_exchange_rate IS NOT NULL AND debt_events.base_amount IS NOT NULL
        THEN CAST(ROUND((
            SELECT candidates.target_amount
            FROM borrowed_debt_manual_open_candidates_migration candidates
            WHERE candidates.event_id = debt_events.id
        ) * debt_events.base_exchange_rate) AS integer)
        ELSE debt_events.base_amount
    END
WHERE debt_events.id IN (
    SELECT candidates.event_id
    FROM borrowed_debt_manual_open_candidates_migration candidates
);
--> statement-breakpoint
UPDATE transactions
SET type = 'EXPENSE',
    from_account_id = (
        SELECT candidates.cash_account_id
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.transaction_id = transactions.id
    ),
    to_account_id = NULL
WHERE transactions.id IN (
    SELECT candidates.transaction_id
    FROM borrowed_debt_transaction_candidates_migration candidates
);
--> statement-breakpoint
UPDATE transaction_entries
SET type = 'CREDIT'
WHERE transaction_entries.id IN (
    SELECT candidates.cash_entry_id
    FROM borrowed_debt_transaction_candidates_migration candidates
);
--> statement-breakpoint
UPDATE transaction_entries
SET type = 'DEBIT',
    kind = 'DEBT_SETTLEMENT',
    category_id = (
        SELECT cash_entries.category_id
        FROM borrowed_debt_transaction_candidates_migration candidates
        INNER JOIN transaction_entries cash_entries
            ON cash_entries.id = candidates.cash_entry_id
        WHERE candidates.debt_entry_id = transaction_entries.id
    ),
    category_source = (
        SELECT cash_entries.category_source
        FROM borrowed_debt_transaction_candidates_migration candidates
        INNER JOIN transaction_entries cash_entries
            ON cash_entries.id = candidates.cash_entry_id
        WHERE candidates.debt_entry_id = transaction_entries.id
    ),
    deleted_at = 1784131200,
    updated_at = 1784131200
WHERE transaction_entries.id IN (
    SELECT candidates.debt_entry_id
    FROM borrowed_debt_transaction_candidates_migration candidates
);
--> statement-breakpoint
UPDATE debt_events
SET created_at = (
        SELECT candidates.debt_entry_created_at
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    updated_at = (
        SELECT candidates.debt_entry_updated_at
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    debt_account_id = (
        SELECT candidates.debt_account_id
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    transaction_id = (
        SELECT candidates.transaction_id
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    transaction_entry_id = (
        SELECT candidates.debt_entry_id
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    direction = 'CLOSE',
    source = 'MIGRATION',
    amount = (
        SELECT candidates.debt_entry_amount
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    base_instrument_id = (
        SELECT candidates.debt_entry_base_instrument_id
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    base_exchange_rate = (
        SELECT candidates.debt_entry_base_exchange_rate
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    base_amount = (
        SELECT candidates.debt_entry_base_amount
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    ),
    operated_at = (
        SELECT candidates.transaction_operated_at
        FROM borrowed_debt_transaction_candidates_migration candidates
        WHERE candidates.existing_event_id = debt_events.id
    )
WHERE debt_events.id IN (
    SELECT candidates.existing_event_id
    FROM borrowed_debt_transaction_candidates_migration candidates
    WHERE candidates.existing_event_id IS NOT NULL
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
    candidates.debt_entry_created_at,
    candidates.debt_entry_updated_at,
    NULL,
    candidates.debt_account_id,
    candidates.transaction_id,
    candidates.debt_entry_id,
    'CLOSE',
    'MIGRATION',
    candidates.debt_entry_amount,
    candidates.debt_entry_base_instrument_id,
    candidates.debt_entry_base_exchange_rate,
    candidates.debt_entry_base_amount,
    candidates.transaction_operated_at
FROM borrowed_debt_transaction_candidates_migration candidates
WHERE candidates.existing_event_id IS NULL
  AND NOT EXISTS (
      SELECT 1
      FROM debt_events live_events
      WHERE live_events.transaction_id = candidates.transaction_id
        AND live_events.deleted_at IS NULL
  );
--> statement-breakpoint
DROP TABLE IF EXISTS borrowed_debt_manual_open_candidates_migration;
--> statement-breakpoint
DROP TABLE IF EXISTS borrowed_debt_transaction_candidates_migration;
--> statement-breakpoint
DROP TABLE IF EXISTS eligible_borrowed_debt_accounts_migration;
