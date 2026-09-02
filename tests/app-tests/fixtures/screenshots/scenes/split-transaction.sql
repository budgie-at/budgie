-- Scene overlay: one purchase split across three categories.
--
-- A split is several `kind = 'PRIMARY'` entries on the same transaction, each
-- with its own `category_id`; the split-entries sheet lists one row per entry
-- and the totals line adds them up. Nothing enforces the sum in the schema, so
-- the entries here add up to the intended receipt total on purpose.
--
-- Two splits are seeded: a supermarket receipt split three ways (the hero of
-- the scene) and a two-way household split, so the transaction list shows the
-- split badge more than once.
--
-- Owns transactions 1800-1899.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1800 AND 1899;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1800 AND 1899;
DELETE FROM transactions WHERE id BETWEEN 1800 AND 1899;

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    account_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, account_id, days_ago, minute, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (1800, 1, 0, 1075, 'Target Superstore', 'Hypermarché Auchan', 'Kaufland Center', 'Hipermercado Alcampo', 'Епіцентр'),
    (1801, 4, 3,  915, 'IKEA',              'IKEA',               'IKEA',            'IKEA',                 'IKEA');

CREATE TEMP TABLE overlay_entry (
    id INTEGER,
    transaction_id INTEGER,
    category_id INTEGER,
    amount INTEGER
);

INSERT INTO overlay_entry (id, transaction_id, category_id, amount) VALUES
    (18000, 1800, 11,  84600000),
    (18001, 1800, 34,  32500000),
    (18002, 1800, 28,  18900000),
    (18010, 1801, 33, 128400000),
    (18011, 1801, 22,  61500000);

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
    overlay_transaction.account_id,
    NULL,
    1.0,
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_entry.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    overlay_transaction.account_id,
    overlay_entry.category_id,
    overlay_entry.transaction_id,
    CAST(ROUND(overlay_entry.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_entry
INNER JOIN overlay_transaction ON overlay_transaction.id = overlay_entry.transaction_id
CROSS JOIN overlay_locale;

DROP TABLE overlay_entry;
DROP TABLE overlay_transaction;
DROP TABLE overlay_locale;
