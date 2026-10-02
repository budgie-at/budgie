-- Adds a lent debt account and a borrowed debt account, opened and partially settled through funding-account money legs.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    (SELECT instrument_id FROM accounts WHERE id = 1) AS instrument_id,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM debt_events WHERE id BETWEEN 1 AND 9;
DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1200 AND 1299;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1200 AND 1299;
DELETE FROM transactions WHERE id BETWEEN 1200 AND 1299;
DELETE FROM account_balances WHERE account_id IN (7, 11);
DELETE FROM accounts WHERE id IN (7, 11);

CREATE TEMP TABLE overlay_account (
    id INTEGER,
    icon TEXT,
    nature TEXT,
    debt_type TEXT,
    deadline_days INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_account (id, icon, nature, debt_type, deadline_days, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (7, 'HandCoins', 'ASSET',     'LENT',   34, 'Lent to Daniel',      'Prêt à Daniel',        'Verliehen an Daniel',  'Prestado a Daniel',    'Позика Данилу'),
    (11, 'Handshake', 'LIABILITY', 'BORROW', 78, 'Borrowed from Mom',   'Emprunt à maman',      'Geliehen von Mama',    'Préstamo de mamá',     'Позичено в мами');

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, deadline, target_balance, include_in_net_worth, is_active
)
SELECT
    overlay_account.id,
    unixepoch('now') - 120 * 86400,
    unixepoch('now') - 4 * 86400,
    overlay_account.icon,
    overlay_account.id,
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
    'DEBT',
    overlay_account.nature,
    overlay_account.debt_type,
    overlay_locale.instrument_id,
    unixepoch('now') + overlay_account.deadline_days * 86400,
    0,
    1,
    1
FROM overlay_account
CROSS JOIN overlay_locale;

INSERT OR IGNORE INTO categories (id, is_default, title, title_search, icon, parent_id, is_system_category) VALUES
    (100000, 1, 'Lending',   'lending',   'HandCoins', NULL, 1),
    (100001, 1, 'Borrowing', 'borrowing', 'Handshake', NULL, 1);

INSERT OR IGNORE INTO default_category_translations (category_id, language, title) VALUES
    (100000, 'en', 'Lending'),
    (100000, 'uk', 'Надані позики'),
    (100000, 'de', 'Verliehenes Geld'),
    (100000, 'es', 'Préstamos Concedidos'),
    (100000, 'fr', 'Prêts Accordés'),
    (100001, 'en', 'Borrowing'),
    (100001, 'uk', 'Отримані позики'),
    (100001, 'de', 'Geliehenes Geld'),
    (100001, 'es', 'Préstamos Recibidos'),
    (100001, 'fr', 'Emprunts');

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    type TEXT,
    debt_account_id INTEGER,
    funding_account_id INTEGER,
    entry_type TEXT,
    category_id INTEGER,
    event_source TEXT,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    direction TEXT,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, type, debt_account_id, funding_account_id, entry_type, category_id, event_source, days_ago, minute, amount, direction, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (1200, 'EXPENSE', 7, 1, 'CREDIT', 100000, 'OPENING', 96, 660, 1200000000, 'OPEN',  'Lent to Daniel',        'Prêt à Daniel',          'Verliehen an Daniel',    'Prestado a Daniel',     'Позика Данилу'),
    (1201, 'INCOME',  11, 1, 'DEBIT',  100001, 'OPENING', 74, 780, 2500000000, 'OPEN',  'Borrowed from Mom',     'Emprunt à maman',        'Geliehen von Mama',      'Préstamo de mamá',      'Позичено в мами'),
    (1202, 'INCOME',  7, 1, 'DEBIT',  100000, 'INCOME_ATTACHMENT', 19, 1080, 450000000, 'CLOSE', 'Daniel partial payback', 'Remboursement partiel', 'Teilrückzahlung Daniel', 'Devolución parcial',    'Часткове повернення'),
    (1203, 'EXPENSE', 11, 1, 'CREDIT', 100001, 'INCOME_ATTACHMENT',  6,  900, 600000000, 'CLOSE', 'Repaid Mom',            'Remboursement à maman',  'Mama zurückgezahlt',     'Devuelto a mamá',       'Повернення мамі');

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
    CASE overlay_transaction.type WHEN 'EXPENSE' THEN overlay_transaction.funding_account_id END,
    CASE overlay_transaction.type WHEN 'INCOME' THEN overlay_transaction.funding_account_id END,
    1.0,
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    overlay_transaction.entry_type,
    overlay_transaction.funding_account_id,
    overlay_transaction.category_id,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'DEBT_SETTLEMENT',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO debt_events (id, created_at, updated_at, debt_account_id, transaction_id, transaction_entry_id, direction, source, amount, operated_at)
SELECT
    ROW_NUMBER() OVER (ORDER BY overlay_transaction.id),
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    overlay_transaction.debt_account_id,
    overlay_transaction.id,
    overlay_transaction.id * 10,
    overlay_transaction.direction,
    overlay_transaction.event_source,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    100 + overlay_account.id,
    unixepoch('now') - 120 * 86400,
    unixepoch('now') - 120 * 86400,
    overlay_account.id,
    CASE overlay_account.debt_type WHEN 'LENT' THEN 1 ELSE -1 END * (
        COALESCE((SELECT SUM(amount) FROM debt_events WHERE debt_account_id = overlay_account.id AND direction = 'OPEN' AND deleted_at IS NULL), 0)
        - COALESCE((SELECT SUM(amount) FROM debt_events WHERE debt_account_id = overlay_account.id AND direction = 'CLOSE' AND deleted_at IS NULL), 0)
    )
FROM overlay_account;

DROP TABLE overlay_transaction;
DROP TABLE overlay_account;
DROP TABLE overlay_locale;
