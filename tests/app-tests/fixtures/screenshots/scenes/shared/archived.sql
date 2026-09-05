-- Adds two archived accounts and one inactive account with balance snapshots and short ledgers.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    (SELECT instrument_id FROM accounts WHERE id = 1) AS instrument_id,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2200 AND 2299;
DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2200 AND 2299;
DELETE FROM transactions WHERE id BETWEEN 2200 AND 2299;
DELETE FROM account_balances WHERE account_id BETWEEN 16 AND 18;
DELETE FROM accounts WHERE id BETWEEN 16 AND 18;

CREATE TEMP TABLE overlay_account (
    id INTEGER,
    icon TEXT,
    type TEXT,
    is_active INTEGER,
    archived_days INTEGER,
    balance INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_account (id, icon, type, is_active, archived_days, balance, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (16, 'Landmark',  'BANK',    1, 62,    24500000,  'Old Chase Checking',      'Ancien compte Société Générale', 'Altes Sparkassen-Konto',      'Cuenta antigua de Santander', 'Старий рахунок ПриватБанку'),
    (17, 'PiggyBank', 'SAVINGS', 1, 148,          0,  'Closed Barclays Savings', 'Livret A clôturé',               'Geschlossenes DKB-Tagesgeld', 'Ahorro BBVA cerrado',         'Закритий депозит Ощадбанку'),
    (18, 'Wallet',    'CASH',    0, NULL, 340000000,  'Vacation Fund 2025',      'Cagnotte vacances 2025',         'Urlaubskasse 2025',         'Hucha vacaciones 2025',      'Скарбничка на відпустку 2025');

INSERT INTO accounts (
    id, created_at, updated_at, deleted_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, target_balance, include_in_net_worth, is_active
)
SELECT
    overlay_account.id,
    unixepoch('now') - 720 * 86400,
    unixepoch('now') - 30 * 86400,
    CASE WHEN overlay_account.archived_days IS NULL THEN NULL ELSE unixepoch('now') - overlay_account.archived_days * 86400 END,
    overlay_account.icon,
    10 + overlay_account.id,
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_account.title_fr
        WHEN 'de' THEN overlay_account.title_de
        WHEN 'es' THEN overlay_account.title_es
        WHEN 'uk' THEN overlay_account.title_uk
        ELSE overlay_account.title_en
    END,
    lower(CASE overlay_locale.language
        WHEN 'fr' THEN overlay_account.title_fr
        WHEN 'de' THEN overlay_account.title_de
        WHEN 'es' THEN overlay_account.title_es
        WHEN 'uk' THEN overlay_account.title_uk
        ELSE overlay_account.title_en
    END),
    overlay_account.type,
    'LIABILITY',
    'LENT',
    overlay_locale.instrument_id,
    0,
    overlay_account.is_active,
    overlay_account.is_active
FROM overlay_account
CROSS JOIN overlay_locale;

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    account_id INTEGER,
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

INSERT INTO overlay_transaction (id, account_id, category_id, days_ago, minute, amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (2200, 16, 10, 210, 620,  118400000, 'Legacy Rent Payment',  'Ancien loyer',              'Alte Mietzahlung',      'Alquiler anterior',      'Стара оренда'),
    (2201, 16, 11, 198, 1010,  46200000, 'Old Weekly Groceries', 'Anciennes courses',         'Alter Wocheneinkauf',   'Compra semanal antigua', 'Старі закупи на тиждень'),
    (2202, 17, 18, 220, 700,  250000000, 'Savings Top Up',       'Versement épargne',         'Sparbeitrag',           'Aportación al ahorro',   'Поповнення накопичень'),
    (2203, 18, 29,  95, 900,  128000000, 'Vacation Deposit',     'Acompte vacances',          'Urlaubsanzahlung',      'Señal de vacaciones',    'Завдаток за відпустку');

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
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    overlay_transaction.account_id,
    overlay_transaction.category_id,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    100 + overlay_account.id,
    unixepoch('now') - 720 * 86400,
    unixepoch('now') - 720 * 86400,
    overlay_account.id,
    CAST(ROUND(overlay_account.balance * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER)
        + COALESCE((
            SELECT SUM(transaction_entries.amount)
            FROM transaction_entries
            WHERE transaction_entries.account_id = overlay_account.id
              AND transaction_entries.type = 'CREDIT'
        ), 0)
FROM overlay_account
CROSS JOIN overlay_locale;

DROP TABLE overlay_transaction;
DROP TABLE overlay_account;
DROP TABLE overlay_locale;
