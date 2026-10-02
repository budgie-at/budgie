-- Adds one supermarket expense split across three categories.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2400 AND 2499;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2400 AND 2499;
DELETE FROM transactions WHERE id BETWEEN 2400 AND 2499;

CREATE TEMP TABLE overlay_entry (id INTEGER, category_id INTEGER, base_amount INTEGER);

INSERT INTO overlay_entry (id, category_id, base_amount) VALUES
    (24000, 11, 62500000),
    (24001, 35, 25000000),
    (24002, 33, 12500000);

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    2400,
    unixepoch(date('now')) - 86400 + 1105 * 60,
    unixepoch(date('now')) - 86400 + 1105 * 60,
    'EXPENSE',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Carrefour Market'
        WHEN 'de' THEN 'REWE'
        WHEN 'es' THEN 'Mercadona'
        WHEN 'uk' THEN 'Сільпо'
        ELSE 'Whole Foods Market'
    END,
    unixepoch(date('now')) - 86400 + 1105 * 60,
    '',
    1,
    NULL,
    1.0,
    0
FROM overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_entry.id,
    unixepoch(date('now')) - 86400 + 1105 * 60,
    unixepoch(date('now')) - 86400 + 1105 * 60,
    'CREDIT',
    1,
    overlay_entry.category_id,
    2400,
    CAST(ROUND(overlay_entry.base_amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_entry
CROSS JOIN overlay_locale;

DROP TABLE overlay_entry;
DROP TABLE overlay_locale;
