DROP TABLE IF EXISTS manual_debt_event_repair_migration;
--> statement-breakpoint
CREATE TEMP TABLE manual_debt_event_repair_migration (
    debt_account_id integer NOT NULL,
    direction text NOT NULL,
    keep_event_id integer NOT NULL,
    repaired_amount integer NOT NULL
);
--> statement-breakpoint
INSERT INTO manual_debt_event_repair_migration (debt_account_id, direction, keep_event_id, repaired_amount)
SELECT
    manual_totals.debt_account_id,
    manual_totals.direction,
    manual_totals.keep_event_id,
    CASE
        WHEN manual_totals.transaction_amount > 0
             AND manual_totals.manual_amount >= manual_totals.transaction_amount
             AND manual_totals.manual_created_at >= manual_totals.transaction_created_at
        THEN manual_totals.manual_amount % manual_totals.transaction_amount
        ELSE manual_totals.manual_amount
    END
FROM (
    SELECT
        manual_events.debt_account_id AS debt_account_id,
        manual_events.direction AS direction,
        MIN(manual_events.id) AS keep_event_id,
        SUM(manual_events.amount) AS manual_amount,
        MAX(manual_events.created_at) AS manual_created_at,
        COALESCE((
            SELECT SUM(other_events.amount)
            FROM debt_events other_events
            WHERE other_events.debt_account_id = manual_events.debt_account_id
              AND other_events.direction = manual_events.direction
              AND other_events.source <> 'MANUAL'
              AND other_events.deleted_at IS NULL
        ), 0) AS transaction_amount,
        COALESCE((
            SELECT MAX(other_events.created_at)
            FROM debt_events other_events
            WHERE other_events.debt_account_id = manual_events.debt_account_id
              AND other_events.direction = manual_events.direction
              AND other_events.source <> 'MANUAL'
              AND other_events.deleted_at IS NULL
        ), 0) AS transaction_created_at
    FROM debt_events manual_events
    INNER JOIN accounts ON accounts.id = manual_events.debt_account_id AND accounts.type = 'DEBT'
    WHERE manual_events.source = 'MANUAL'
      AND manual_events.deleted_at IS NULL
    GROUP BY manual_events.debt_account_id, manual_events.direction
) manual_totals;
--> statement-breakpoint
DELETE FROM debt_events
WHERE source = 'MANUAL'
  AND deleted_at IS NULL
  AND debt_account_id IN (SELECT debt_account_id FROM manual_debt_event_repair_migration)
  AND id NOT IN (SELECT keep_event_id FROM manual_debt_event_repair_migration);
--> statement-breakpoint
UPDATE debt_events
SET amount = (
        SELECT repair.repaired_amount
        FROM manual_debt_event_repair_migration repair
        WHERE repair.keep_event_id = debt_events.id
    ),
    updated_at = unixepoch()
WHERE id IN (SELECT keep_event_id FROM manual_debt_event_repair_migration WHERE repaired_amount > 0);
--> statement-breakpoint
DELETE FROM debt_events
WHERE id IN (SELECT keep_event_id FROM manual_debt_event_repair_migration WHERE repaired_amount <= 0);
--> statement-breakpoint
DROP TABLE manual_debt_event_repair_migration;
--> statement-breakpoint
DROP TABLE IF EXISTS debt_account_balance_repair_migration;
--> statement-breakpoint
CREATE TEMP TABLE debt_account_balance_repair_migration (
    account_id integer PRIMARY KEY NOT NULL,
    ledger_balance integer NOT NULL
);
--> statement-breakpoint
INSERT INTO debt_account_balance_repair_migration (account_id, ledger_balance)
SELECT
    accounts.id,
    CASE accounts.debt_type WHEN 'LENT' THEN remaining_amount ELSE -remaining_amount END
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
        SELECT accounts_for_open.id AS account_id, COALESCE((
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
        SELECT accounts_for_close.id AS account_id, COALESCE((
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
        SELECT repair.ledger_balance
        FROM debt_account_balance_repair_migration repair
        WHERE repair.account_id = account_balances.account_id
    ),
    updated_at = unixepoch()
WHERE account_id IN (SELECT account_id FROM debt_account_balance_repair_migration);
--> statement-breakpoint
UPDATE accounts
SET nature = CASE debt_type WHEN 'LENT' THEN 'ASSET' ELSE 'LIABILITY' END
WHERE type = 'DEBT'
  AND debt_type IS NOT NULL
  AND nature <> CASE debt_type WHEN 'LENT' THEN 'ASSET' ELSE 'LIABILITY' END;
--> statement-breakpoint
DROP TABLE debt_account_balance_repair_migration;
