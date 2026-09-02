-- Scene overlay: a budget about to blow, with one category already over.
--
-- `budgie://budget` redirects home unless a budget exists; the active budget is
-- the most recently updated non-deleted row (`budgetRepository.findActive`), so
-- this overlay pins budget 1 as the active one.
--
-- The limits are DERIVED from the real in-period spend instead of hard-coded,
-- so the ring lands on ~95% in every locale (each locale scales amounts
-- differently) and on every capture day:
--
--   overall_limit          = in-period spend / 0.95
--   Groceries limit        = that category's in-period spend * 0.88  (over)
--   other_limit            = overall_limit - sum(category limits)     (never negative)
--
-- `period_start_day` is pushed to ~28 days ago so the period is nearly over and
-- the "days left" pill reads low, which is the state the hero shot needs.
--
-- Owns transactions 1000-1099.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1000 AND 1099;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1000 AND 1099;
DELETE FROM transactions WHERE id BETWEEN 1000 AND 1099;

-- Fresh grocery runs inside the period, so tapping the over-budget limit row
-- opens a list with recent rows rather than month-old ones.
CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, days_ago, minute, amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (1000, 0, 1125, 96450000, 'Whole Foods Market', 'Carrefour Market', 'REWE',              'Mercadona',           'Сільпо'),
    (1001, 1,  735, 41200000, 'Trader Joe''s',      'Monoprix',         'EDEKA',             'Carrefour Express',   'АТБ'),
    (1002, 2, 1180, 63700000, 'Costco',             'Auchan',           'Kaufland',          'Alcampo',             'METRO');

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_transaction.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'EXPENSE',
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_transaction.title_fr
        WHEN 'de' THEN overlay_transaction.title_de
        WHEN 'es' THEN overlay_transaction.title_es
        WHEN 'uk' THEN overlay_transaction.title_uk
        ELSE overlay_transaction.title_en
    END,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    '',
    1,
    NULL,
    1.0,
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    1,
    11,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

-- ~28 days into a monthly period. Both branches stay within 1..28, so every
-- month has that day, exactly like shift-dates.sql's own clamp.
CREATE TEMP TABLE overlay_period AS
SELECT CASE
    WHEN CAST(strftime('%d', 'now') AS INTEGER) > 27
        THEN CAST(strftime('%d', 'now') AS INTEGER) - 27
    ELSE CAST(strftime('%d', 'now') AS INTEGER) + 1
END AS period_start_day;

UPDATE budgets
SET
    period_start_day = (SELECT period_start_day FROM overlay_period),
    use_last_day_of_month = 0,
    updated_at = unixepoch('now')
WHERE id = 1;

-- Budget 2 has to lose the race for "most recently updated", otherwise
-- budgie://budget opens the wrong one.
UPDATE budgets SET updated_at = unixepoch('now') - 86400 WHERE id != 1;

-- Mirrors budgetPeriodService.computePeriodWindow for use_last_day_of_month = 0.
CREATE TEMP TABLE overlay_window AS
SELECT unixepoch(CASE
    WHEN CAST(strftime('%d', 'now') AS INTEGER) >= (SELECT period_start_day FROM overlay_period)
        THEN date('now', 'start of month', '+' || ((SELECT period_start_day FROM overlay_period) - 1) || ' days')
    ELSE date('now', 'start of month', '-1 month', '+' || ((SELECT period_start_day FROM overlay_period) - 1) || ' days')
END) AS period_start;

CREATE TEMP TABLE overlay_spend AS
SELECT
    COALESCE(SUM(transaction_entries.amount), 0) AS total_amount,
    COALESCE(SUM(CASE WHEN transaction_entries.category_id = 11 THEN transaction_entries.amount ELSE 0 END), 0) AS groceries_amount
FROM transaction_entries
INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id
WHERE transactions.type = 'EXPENSE'
  AND transactions.deleted_at IS NULL
  AND transaction_entries.type = 'CREDIT'
  AND transaction_entries.deleted_at IS NULL
  AND transactions.operated_at >= (SELECT period_start FROM overlay_window);

CREATE TEMP TABLE overlay_limit AS
SELECT
    10 AS category_id,
    CAST(ROUND((SELECT total_amount FROM overlay_spend) * 0.42 / (SELECT rounding_unit FROM overlay_locale)) * (SELECT rounding_unit FROM overlay_locale) AS INTEGER) AS limit_amount
UNION ALL
SELECT
    11,
    CAST(ROUND((SELECT groceries_amount FROM overlay_spend) * 0.88 / (SELECT rounding_unit FROM overlay_locale)) * (SELECT rounding_unit FROM overlay_locale) AS INTEGER)
UNION ALL
SELECT
    13,
    CAST(ROUND((SELECT total_amount FROM overlay_spend) * 0.05 / (SELECT rounding_unit FROM overlay_locale)) * (SELECT rounding_unit FROM overlay_locale) AS INTEGER)
UNION ALL
SELECT
    14,
    CAST(ROUND((SELECT total_amount FROM overlay_spend) * 0.05 / (SELECT rounding_unit FROM overlay_locale)) * (SELECT rounding_unit FROM overlay_locale) AS INTEGER);

UPDATE budget_category_limits
SET
    limit_amount = (SELECT overlay_limit.limit_amount FROM overlay_limit WHERE overlay_limit.category_id = budget_category_limits.category_id),
    updated_at = unixepoch('now')
WHERE budget_id = 1
  AND category_id IN (SELECT category_id FROM overlay_limit);

UPDATE budgets
SET
    overall_limit = MAX(
        CAST(ROUND((SELECT total_amount FROM overlay_spend) / 0.95 / (SELECT rounding_unit FROM overlay_locale)) * (SELECT rounding_unit FROM overlay_locale) AS INTEGER),
        (SELECT COALESCE(SUM(limit_amount), 0) FROM budget_category_limits WHERE budget_id = 1 AND deleted_at IS NULL)
    )
WHERE id = 1;

UPDATE budgets
SET other_limit = overall_limit - (SELECT COALESCE(SUM(limit_amount), 0) FROM budget_category_limits WHERE budget_id = 1 AND deleted_at IS NULL)
WHERE id = 1;

DROP TABLE overlay_limit;
DROP TABLE overlay_spend;
DROP TABLE overlay_window;
DROP TABLE overlay_period;
DROP TABLE overlay_transaction;
DROP TABLE overlay_locale;
