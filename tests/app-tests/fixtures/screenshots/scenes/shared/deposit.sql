-- Adds a term deposit account with maturity date, interest rate, and accrued interest history.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    (SELECT instrument_id FROM accounts WHERE id = 1) AS instrument_id,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1300 AND 1399;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1300 AND 1399;
DELETE FROM transactions WHERE id BETWEEN 1300 AND 1399;
DELETE FROM account_balances WHERE account_id = 8;
DELETE FROM accounts WHERE id = 8;

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, deadline, target_balance, interest_rate, include_in_net_worth, is_active
)
SELECT
    8,
    unixepoch('now') - 245 * 86400,
    unixepoch('now') - 5 * 86400,
    'Vault',
    8,
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Dépôt à terme 12 mois'
        WHEN 'de' THEN 'Festgeld 12 Monate'
        WHEN 'es' THEN 'Depósito a plazo 12 meses'
        WHEN 'uk' THEN 'Депозит на 12 місяців'
        ELSE '12-Month Term Deposit'
    END,
    lower(CASE overlay_locale.language
        WHEN 'fr' THEN 'Dépôt à terme 12 mois'
        WHEN 'de' THEN 'Festgeld 12 Monate'
        WHEN 'es' THEN 'Depósito a plazo 12 meses'
        WHEN 'uk' THEN 'Депозит на 12 місяців'
        ELSE '12-Month Term Deposit'
    END),
    'DEPOSIT',
    'ASSET',
    'LENT',
    overlay_locale.instrument_id,
    unixepoch('now') + 120 * 86400,
    CAST(ROUND(15750000000 * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    4.35,
    1,
    1
FROM overlay_locale;

CREATE TEMP TABLE overlay_interest AS
WITH RECURSIVE month_offset(months_ago) AS (
    SELECT 0
    UNION ALL
    SELECT months_ago + 1 FROM month_offset WHERE months_ago < 7
)
SELECT
    1300 + months_ago AS id,
    unixepoch(datetime(date('now', '-' || months_ago || ' months', '-4 days'), '10:20:00')) AS operated_at,
    54200000 - months_ago * 900000 AS amount
FROM month_offset;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_interest.id,
    overlay_interest.operated_at,
    overlay_interest.operated_at,
    'INCOME',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Intérêts du dépôt'
        WHEN 'de' THEN 'Festgeldzinsen'
        WHEN 'es' THEN 'Intereses del depósito'
        WHEN 'uk' THEN 'Відсотки за депозитом'
        ELSE 'Deposit Interest'
    END,
    overlay_interest.operated_at,
    '',
    NULL,
    8,
    1.0,
    0
FROM overlay_interest
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_interest.id * 10,
    overlay_interest.operated_at,
    overlay_interest.operated_at,
    'DEBIT',
    8,
    19,
    overlay_interest.id,
    CAST(ROUND(overlay_interest.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_interest
CROSS JOIN overlay_locale;

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    108,
    unixepoch('now') - 245 * 86400,
    unixepoch('now') - 245 * 86400,
    8,
    CAST(ROUND(15000000000 * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER)
FROM overlay_locale;

DROP TABLE overlay_interest;
DROP TABLE overlay_locale;
