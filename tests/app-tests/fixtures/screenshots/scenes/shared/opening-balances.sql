-- Books an opening ADJUSTMENT for every asset account whose ledger falls short of its intended balance, then sets account_balances to the ledger.

CREATE TEMP TABLE overlay_ledger AS
SELECT
    accounts.id AS account_id,
    accounts.instrument_id AS instrument_id,
    COALESCE(account_balances.amount, 0) AS snapshot_amount,
    COALESCE((
        SELECT SUM(CASE
            WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount
            WHEN transaction_entries.type IN ('CREDIT', 'FEE') THEN -transaction_entries.amount
            ELSE 0
        END)
        FROM transaction_entries
        INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id
        WHERE transaction_entries.account_id = accounts.id
          AND transaction_entries.deleted_at IS NULL
          AND transactions.deleted_at IS NULL
          AND transactions.consolidation_parent_transaction_id IS NULL
          AND (transaction_entries.original_transaction_id IS NULL OR transactions.consolidation_type = 'REFUND')
    ), 0) AS ledger_amount,
    MIN(COALESCE((
        SELECT MIN(transactions.operated_at)
        FROM transaction_entries
        INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id
        WHERE transaction_entries.account_id = accounts.id
    ), unixepoch('now')), unixepoch('now', '-90 days')) - 86400 AS opened_at
FROM accounts
LEFT JOIN account_balances ON account_balances.account_id = accounts.id
WHERE accounts.deleted_at IS NULL
  AND accounts.type IN ('BANK', 'CASH', 'SAVINGS', 'DEPOSIT', 'CRYPTO');

CREATE TEMP TABLE overlay_opening AS
SELECT
    7000 + overlay_ledger.account_id AS transaction_id,
    overlay_ledger.account_id AS account_id,
    overlay_ledger.instrument_id AS instrument_id,
    overlay_ledger.opened_at AS opened_at,
    CASE
        WHEN MAX(overlay_ledger.snapshot_amount + overlay_ledger.ledger_amount, overlay_ledger.ledger_amount) > 0
            THEN MAX(overlay_ledger.snapshot_amount + overlay_ledger.ledger_amount, overlay_ledger.ledger_amount)
        ELSE ABS(overlay_ledger.snapshot_amount + overlay_ledger.ledger_amount)
    END - overlay_ledger.ledger_amount AS amount,
    settings.default_instrument_id AS base_instrument_id,
    CASE
        WHEN overlay_ledger.instrument_id = settings.default_instrument_id THEN 1.0
        ELSE (
            SELECT exchange_rates.rate
            FROM exchange_rates
            WHERE exchange_rates.base_instrument_id = overlay_ledger.instrument_id
              AND exchange_rates.quote_instrument_id = settings.default_instrument_id
            ORDER BY exchange_rates.updated_at DESC
            LIMIT 1
        )
    END AS base_exchange_rate
FROM overlay_ledger
CROSS JOIN settings;

DELETE FROM overlay_opening
WHERE amount <= 0
   OR EXISTS (SELECT 1 FROM transactions WHERE transactions.id BETWEEN 7000 AND 7099);

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_opening.transaction_id,
    overlay_opening.opened_at,
    overlay_opening.opened_at,
    'ADJUSTMENT',
    '',
    overlay_opening.opened_at,
    '',
    NULL,
    overlay_opening.account_id,
    COALESCE(overlay_opening.base_exchange_rate, 1.0),
    0
FROM overlay_opening;

INSERT INTO transaction_entries (
    id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate,
    category_source, kind, base_instrument_id, base_exchange_rate, base_amount
)
SELECT
    overlay_opening.transaction_id * 10,
    overlay_opening.opened_at,
    overlay_opening.opened_at,
    'DEBIT',
    overlay_opening.account_id,
    NULL,
    overlay_opening.transaction_id,
    overlay_opening.amount,
    COALESCE(overlay_opening.base_exchange_rate, 1.0),
    'USER',
    'PRIMARY',
    CASE WHEN overlay_opening.base_exchange_rate IS NULL THEN NULL ELSE overlay_opening.base_instrument_id END,
    overlay_opening.base_exchange_rate,
    CAST(ROUND(overlay_opening.amount * overlay_opening.base_exchange_rate) AS INTEGER)
FROM overlay_opening;

UPDATE account_balances
SET
    amount = COALESCE((
        SELECT SUM(CASE
            WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount
            WHEN transaction_entries.type IN ('CREDIT', 'FEE') THEN -transaction_entries.amount
            ELSE 0
        END)
        FROM transaction_entries
        INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id
        WHERE transaction_entries.account_id = account_balances.account_id
          AND transaction_entries.deleted_at IS NULL
          AND transactions.deleted_at IS NULL
          AND transactions.consolidation_parent_transaction_id IS NULL
          AND (transaction_entries.original_transaction_id IS NULL OR transactions.consolidation_type = 'REFUND')
    ), 0),
    updated_at = unixepoch('now');

DROP TABLE overlay_opening;
DROP TABLE overlay_ledger;
