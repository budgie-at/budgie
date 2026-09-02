-- Scene overlay: bank fees attached to an expense, an income and a transfer.
--
-- A fee is a `transaction_entries` row with `type = 'FEE'` and
-- `category_id = 32` (BANK_FEE_CATEGORY_ID), hanging off an ordinary
-- transaction. The bank-fee page's whole point is a fee on a TRANSFER, which
-- bank-sync-connected does not guarantee, so all three carriers are seeded here.
--
-- The fee analytics roll fees up under the "Bank Fees & Charges" category, so
-- a handful of older fees are seeded too and the category is not a single bar.
--
-- Owns transactions 2300-2399.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2300 AND 2399;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2300 AND 2399;
DELETE FROM transactions WHERE id BETWEEN 2300 AND 2399;

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    type TEXT,
    from_account_id INTEGER,
    to_account_id INTEGER,
    category_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    fee_amount INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, type, from_account_id, to_account_id, category_id, days_ago, minute, amount, fee_amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (2300, 'TRANSFER', 1,    3,    7,  0,  680, 900000000,  4500000, 'Wire to Emergency Savings', 'Virement vers l''épargne', 'Überweisung zum Notgroschen', 'Transferencia al fondo',   'Переказ на резервний фонд'),
    (2301, 'EXPENSE',  4,    NULL, 29, 2,  1130, 268000000, 8040000, 'Hotel Abroad',              'Hôtel à l''étranger',      'Hotel im Ausland',            'Hotel en el extranjero',   'Готель за кордоном'),
    (2302, 'INCOME',   NULL, 1,    21, 6,  900,  900000000, 12500000, 'Freelance Invoice',        'Facture freelance',        'Freelance-Rechnung',          'Factura freelance',        'Рахунок за фриланс'),
    (2303, 'TRANSFER', 1,    2,    7,  17, 720,  200000000, 3000000, 'ATM Withdrawal Abroad',     'Retrait au DAB étranger',  'Bargeldabhebung im Ausland',  'Retirada en cajero extranjero', 'Зняття готівки за кордоном'),
    (2304, 'EXPENSE',  1,    NULL, 22, 29, 1015, 154000000, 4620000, 'Overseas Purchase',         'Achat à l''étranger',      'Auslandskauf',                'Compra en el extranjero',  'Покупка за кордоном');

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_transaction.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    overlay_transaction.type,
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_transaction.title_fr
        WHEN 'de' THEN overlay_transaction.title_de
        WHEN 'es' THEN overlay_transaction.title_es
        WHEN 'uk' THEN overlay_transaction.title_uk
        ELSE overlay_transaction.title_en
    END,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    '',
    overlay_transaction.from_account_id,
    overlay_transaction.to_account_id,
    1.0,
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

-- The money leg. Transfers get both a CREDIT and a DEBIT; expenses only a
-- CREDIT; incomes only a DEBIT.
INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    overlay_transaction.from_account_id,
    overlay_transaction.category_id,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale
WHERE overlay_transaction.from_account_id IS NOT NULL
UNION ALL
SELECT
    overlay_transaction.id * 10 + 1,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'DEBIT',
    overlay_transaction.to_account_id,
    overlay_transaction.category_id,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale
WHERE overlay_transaction.to_account_id IS NOT NULL;

-- The fee leg, always charged to the account the money moved out of (or into,
-- for an income), and always categorised as Bank Fees & Charges.
INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10 + 2,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'FEE',
    COALESCE(overlay_transaction.from_account_id, overlay_transaction.to_account_id),
    32,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.fee_amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'FEE',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

DROP TABLE overlay_transaction;
DROP TABLE overlay_locale;
