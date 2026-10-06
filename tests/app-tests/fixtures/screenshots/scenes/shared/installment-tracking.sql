-- Adds an electronics purchase paid in parts on the main account and its first monthly part, ready to convert into an installment plan.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit,
    CASE settings.language
        WHEN 'fr' THEN 'Fnac'
        WHEN 'de' THEN 'MediaMarkt'
        WHEN 'es' THEN 'El Corte Inglés'
        WHEN 'uk' THEN 'Comfy'
        ELSE 'Apple Store'
    END AS merchant
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2600 AND 2699;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2600 AND 2699;
DELETE FROM transactions WHERE id BETWEEN 2600 AND 2699;

CREATE TEMP TABLE overlay_part (transaction_id INTEGER, entry_id INTEGER, operated_at INTEGER);

INSERT INTO overlay_part (transaction_id, entry_id, operated_at) VALUES
    (2600, 26000, unixepoch(date('now', '-30 days')) + 760 * 60),
    (2601, 26010, unixepoch(date('now', '-1 day')) + 615 * 60);

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT overlay_part.transaction_id, overlay_part.operated_at, overlay_part.operated_at, 'EXPENSE', overlay_locale.merchant, overlay_part.operated_at, '', 1, NULL, 1.0, 0
FROM overlay_part
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_part.entry_id,
    overlay_part.operated_at,
    overlay_part.operated_at,
    'CREDIT',
    1,
    35,
    overlay_part.transaction_id,
    CAST(ROUND(1870530000 * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_part
CROSS JOIN overlay_locale;

DROP TABLE overlay_part;
DROP TABLE overlay_locale;
