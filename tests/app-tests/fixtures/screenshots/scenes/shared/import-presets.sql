-- Adds a CSV-imported bank integration and account with previously imported transactions.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    (SELECT instrument_id FROM accounts WHERE id = 1) AS instrument_id,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2400 AND 2499;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2400 AND 2499;
DELETE FROM transactions WHERE id BETWEEN 2400 AND 2499;
DELETE FROM account_balances WHERE account_id = 19;
DELETE FROM accounts WHERE id = 19;
DELETE FROM bank_integrations WHERE id = 2;
DELETE FROM bank_integrations WHERE provider = 'CSV';

INSERT INTO bank_integrations (id, created_at, updated_at, provider, token)
VALUES (2, unixepoch('now') - 62 * 86400, unixepoch('now') - 9 * 86400, 'CSV', '');

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, external_source, integration_id, target_balance, include_in_net_worth, is_active
)
SELECT
    19,
    unixepoch('now') - 62 * 86400,
    unixepoch('now') - 9 * 86400,
    'FileSpreadsheet',
    19,
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Compte importé (CSV)'
        WHEN 'de' THEN 'Importiertes Konto (CSV)'
        WHEN 'es' THEN 'Cuenta importada (CSV)'
        WHEN 'uk' THEN 'Імпортований рахунок (CSV)'
        ELSE 'Imported Account (CSV)'
    END,
    lower(CASE overlay_locale.language
        WHEN 'fr' THEN 'Compte importé (CSV)'
        WHEN 'de' THEN 'Importiertes Konto (CSV)'
        WHEN 'es' THEN 'Cuenta importada (CSV)'
        WHEN 'uk' THEN 'Імпортований рахунок (CSV)'
        ELSE 'Imported Account (CSV)'
    END),
    'BANK',
    'LIABILITY',
    'LENT',
    overlay_locale.instrument_id,
    'CSV',
    2,
    0,
    1,
    1
FROM overlay_locale;

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    category_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, category_id, days_ago, minute, amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (2400, 11, 9,  1005, 72300000, 'Supermarket',      'Supermarché',        'Supermarkt',        'Supermercado',      'Супермаркет'),
    (2401, 10, 11,  640, 84900000, 'Utility Bill',     'Facture d''énergie', 'Nebenkostenrechnung', 'Factura de suministros', 'Комунальні послуги'),
    (2402, 13, 14,  515, 15200000, 'Public Transport', 'Transports publics', 'Nahverkehr',        'Transporte público', 'Громадський транспорт'),
    (2403, 12, 18, 1150, 38700000, 'Restaurant',       'Restaurant',         'Restaurant',        'Restaurante',       'Ресторан'),
    (2404, 22, 24,  875, 96100000, 'Online Store',     'Boutique en ligne',  'Onlineshop',        'Tienda online',     'Інтернет-магазин');

INSERT INTO transactions (id, created_at, updated_at, type, title, external_id, operated_at, comment, from_account_id, to_account_id, exchange_rate, external_source, needs_embedding)
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
    'csv_row_' || overlay_transaction.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    '',
    19,
    NULL,
    1.0,
    'CSV',
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, external_id, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    19,
    overlay_transaction.category_id,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    'csv_row_' || overlay_transaction.id,
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    119,
    unixepoch('now') - 62 * 86400,
    unixepoch('now') - 62 * 86400,
    19,
    CAST(ROUND(1284000000 * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER)
        + COALESCE((
            SELECT SUM(transaction_entries.amount)
            FROM transaction_entries
            WHERE transaction_entries.account_id = 19 AND transaction_entries.type = 'CREDIT'
        ), 0)
FROM overlay_locale;

DROP TABLE overlay_transaction;
DROP TABLE overlay_locale;
