-- Seeds 3 complete, net-negative calendar months on the primary checking
-- account so Runway clears RUNWAY_MINIMUM_MONTHS, plus a crypto holding with
-- a live market rate (via shared/crypto.sql) so the "Include crypto" toggle
-- moves the verdict's months figure.

.read shared/crypto.sql

DELETE FROM transaction_entries WHERE transaction_id BETWEEN 5100 AND 5199;
DELETE FROM transactions WHERE id BETWEEN 5100 AND 5199;

CREATE TEMP TABLE runway_history_month (
    months_ago INTEGER,
    transaction_id INTEGER,
    entry_id INTEGER,
    kind TEXT,
    entry_type TEXT,
    amount INTEGER,
    category_id INTEGER
);

INSERT INTO runway_history_month VALUES
    (1, 5101, 51010, 'EXPENSE', 'CREDIT', 8000000000, 10),
    (1, 5102, 51020, 'INCOME',  'DEBIT',  1000000000, 20),
    (2, 5103, 51030, 'EXPENSE', 'CREDIT', 8000000000, 10),
    (2, 5104, 51040, 'INCOME',  'DEBIT',  1000000000, 20),
    (3, 5105, 51050, 'EXPENSE', 'CREDIT', 8000000000, 10),
    (3, 5106, 51060, 'INCOME',  'DEBIT',  1000000000, 20);

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, to_account_id, from_account_id, exchange_rate, needs_embedding)
SELECT
    runway_history_month.transaction_id,
    unixepoch(date('now', 'start of month', '-' || runway_history_month.months_ago || ' months', '+9 days', '+12 hours')),
    unixepoch(date('now', 'start of month', '-' || runway_history_month.months_ago || ' months', '+9 days', '+12 hours')),
    runway_history_month.kind,
    'Runway History',
    unixepoch(date('now', 'start of month', '-' || runway_history_month.months_ago || ' months', '+9 days', '+12 hours')),
    '',
    CASE WHEN runway_history_month.kind = 'INCOME' THEN 1 ELSE NULL END,
    CASE WHEN runway_history_month.kind = 'EXPENSE' THEN 1 ELSE NULL END,
    1.0,
    0
FROM runway_history_month;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind, base_instrument_id, base_exchange_rate, base_amount)
SELECT
    runway_history_month.entry_id,
    unixepoch(date('now', 'start of month', '-' || runway_history_month.months_ago || ' months', '+9 days', '+12 hours')),
    unixepoch(date('now', 'start of month', '-' || runway_history_month.months_ago || ' months', '+9 days', '+12 hours')),
    runway_history_month.entry_type,
    1,
    runway_history_month.category_id,
    runway_history_month.transaction_id,
    runway_history_month.amount,
    1.0,
    'USER',
    'PRIMARY',
    1,
    1.0,
    runway_history_month.amount
FROM runway_history_month;

UPDATE account_balances
SET created_at = unixepoch('now'), updated_at = unixepoch('now')
WHERE account_id = 1;

DROP TABLE runway_history_month;
