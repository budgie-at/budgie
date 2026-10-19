-- Derives budget 1 limits from the current period's spend so the overall bar lands near 65% with a green and amber category mix.

CREATE TEMP TABLE overlay_unit AS
SELECT CASE settings.language WHEN 'uk' THEN 100000000 ELSE 10000000 END AS rounding_unit
FROM settings;

CREATE TEMP TABLE overlay_window AS
SELECT unixepoch(CASE
    WHEN CAST(strftime('%d', 'now') AS INTEGER) >= budgets.period_start_day
        THEN date('now', 'start of month', '+' || (budgets.period_start_day - 1) || ' days')
    ELSE date('now', 'start of month', '-1 month', '+' || (budgets.period_start_day - 1) || ' days')
END) AS period_start
FROM budgets
WHERE budgets.id = 1;

CREATE TEMP TABLE overlay_spend AS
SELECT
    transaction_entries.category_id AS category_id,
    SUM(transaction_entries.amount) AS amount
FROM transaction_entries
INNER JOIN transactions ON transactions.id = transaction_entries.transaction_id
WHERE transactions.type = 'EXPENSE'
  AND transactions.deleted_at IS NULL
  AND transaction_entries.type = 'CREDIT'
  AND transaction_entries.deleted_at IS NULL
  AND transactions.operated_at >= (SELECT period_start FROM overlay_window)
GROUP BY transaction_entries.category_id;

CREATE TEMP TABLE overlay_target (category_id INTEGER, ratio REAL);

INSERT INTO overlay_target (category_id, ratio) VALUES
    (10, 0.74),
    (11, 0.86),
    (13, 0.62),
    (14, 0.83);

UPDATE budget_category_limits
SET
    limit_amount = MAX(
        (SELECT rounding_unit FROM overlay_unit),
        CAST(ROUND(
            COALESCE((SELECT overlay_spend.amount FROM overlay_spend WHERE overlay_spend.category_id = budget_category_limits.category_id), 0)
            / (SELECT overlay_target.ratio FROM overlay_target WHERE overlay_target.category_id = budget_category_limits.category_id)
            / (SELECT rounding_unit FROM overlay_unit)
        ) * (SELECT rounding_unit FROM overlay_unit) AS INTEGER)
    ),
    updated_at = unixepoch('now')
WHERE budget_id = 1
  AND category_id IN (SELECT category_id FROM overlay_target);

UPDATE budgets
SET
    other_limit = MAX(
        (SELECT rounding_unit FROM overlay_unit),
        CAST(ROUND(
            COALESCE((SELECT SUM(overlay_spend.amount) FROM overlay_spend WHERE overlay_spend.category_id IS NULL OR overlay_spend.category_id NOT IN (SELECT category_id FROM overlay_target)), 0)
            / 0.52
            / (SELECT rounding_unit FROM overlay_unit)
        ) * (SELECT rounding_unit FROM overlay_unit) AS INTEGER)
    ),
    updated_at = unixepoch('now')
WHERE id = 1;

UPDATE budgets
SET overall_limit = other_limit + (SELECT COALESCE(SUM(limit_amount), 0) FROM budget_category_limits WHERE budget_id = 1 AND deleted_at IS NULL)
WHERE id = 1;

UPDATE budgets SET updated_at = unixepoch('now') - 86400 WHERE id != 1;

DROP TABLE overlay_target;
DROP TABLE overlay_spend;
DROP TABLE overlay_window;
DROP TABLE overlay_unit;
