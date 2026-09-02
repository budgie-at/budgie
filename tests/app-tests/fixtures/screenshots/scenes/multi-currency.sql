-- Scene overlay: a multi-currency net worth.
--
-- Adds two accounts denominated in the two currencies the locale overlays do
-- NOT use, so every locale ends up with three live currencies and the
-- net-worth header has real per-currency legs to break down.
--
--   en          -> USD base, adds EUR + UAH
--   fr, de, es  -> EUR base, adds USD + UAH
--   uk          -> UAH base, adds USD + EUR
--
-- `exchange_rates` is unique on (base_instrument_id, quote_instrument_id) and
-- the conversion helpers look up the direct pair before the inverse, so the
-- EUR<->UAH pair the base fixture never carried is inserted here in both
-- directions.
--
-- Amounts on the two new accounts are already denominated in their own
-- currency, so they are deliberately NOT run through the locale amount scale.
--
-- Owns accounts 5-6, account_balances 105-106, exchange_rates 101-102 and
-- transactions 1100-1199.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    (SELECT instrument_id FROM accounts WHERE id = 1) AS base_instrument_id,
    CASE (SELECT instrument_id FROM accounts WHERE id = 1) WHEN 1 THEN 2 ELSE 1 END AS second_instrument_id,
    CASE (SELECT instrument_id FROM accounts WHERE id = 1) WHEN 33 THEN 2 ELSE 33 END AS third_instrument_id
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1100 AND 1199;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1100 AND 1199;
DELETE FROM transactions WHERE id BETWEEN 1100 AND 1199;
DELETE FROM account_balances WHERE account_id BETWEEN 5 AND 6;
DELETE FROM accounts WHERE id BETWEEN 5 AND 6;
DELETE FROM exchange_rates WHERE (base_instrument_id = 2 AND quote_instrument_id = 33) OR (base_instrument_id = 33 AND quote_instrument_id = 2);

INSERT INTO exchange_rates (id, created_at, updated_at, source, base_instrument_id, quote_instrument_id, rate) VALUES
    (101, unixepoch('now') - 3600, unixepoch('now') - 3600, 'exchangerate-api.com',  2, 33, 50.91),
    (102, unixepoch('now') - 3600, unixepoch('now') - 3600, 'exchangerate-api.com', 33,  2, 0.019642506);

CREATE TEMP TABLE overlay_rate AS
SELECT CASE
    WHEN second_instrument_id = 1 AND third_instrument_id = 33 THEN 43.43
    WHEN second_instrument_id = 1 AND third_instrument_id = 2 THEN 0.853
    ELSE 50.91
END AS transfer_rate
FROM overlay_locale;

CREATE TEMP TABLE overlay_account (
    id INTEGER,
    icon TEXT,
    type TEXT,
    instrument_id INTEGER,
    balance INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_account (id, icon, type, instrument_id, balance, title_en, title_fr, title_de, title_es, title_uk)
SELECT
    5, 'Wallet', 'BANK', overlay_locale.second_instrument_id, 1840000000,
    'Wise Multi-Currency', 'Compte Wise multidevise', 'Wise Fremdwährungskonto', 'Cuenta Wise multidivisa', 'Мультивалютний Wise'
FROM overlay_locale
UNION ALL
SELECT
    6, 'Plane', 'SAVINGS', overlay_locale.third_instrument_id, 2650000000,
    'Travel Reserve', 'Réserve voyages', 'Reiserücklage', 'Reserva de viajes', 'Резерв на подорожі'
FROM overlay_locale;

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, target_balance, include_in_net_worth, is_active
)
SELECT
    overlay_account.id,
    unixepoch('now') - 300 * 86400,
    unixepoch('now') - 3 * 86400,
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
    overlay_account.type,
    'LIABILITY',
    'LENT',
    overlay_account.instrument_id,
    0,
    1,
    1
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
    (1100, 5, 29,  2,  620, 184000000, 'Booking.com',    'Booking.com',       'Booking.com',      'Booking.com',         'Booking.com'),
    (1101, 5, 12,  5, 1180,  42500000, 'Airport Lounge', 'Salon d''aéroport', 'Flughafen-Lounge', 'Sala VIP aeropuerto', 'Бізнес-зала аеропорту'),
    (1102, 5, 22,  9,  900,  96800000, 'Duty Free',      'Duty Free',         'Duty-free-Shop',   'Duty Free',           'Duty Free'),
    (1103, 6, 29, 14,  700, 310000000, 'Flight Deposit', 'Acompte vol',       'Fluganzahlung',    'Señal del vuelo',     'Завдаток за переліт'),
    (1104, 6, 24, 21, 1140,  78400000, 'Museum Pass',    'Pass musées',       'Museumspass',      'Pase de museos',      'Музейний абонемент');

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
    overlay_transaction.amount,
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction;

-- One cross-currency transfer between the two new accounts, so the transfer
-- form opens with both legs and a stored rate instead of a blank dual input.
INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    1110,
    unixepoch(date('now')) - 7 * 86400 + 780 * 60,
    unixepoch(date('now')) - 7 * 86400 + 780 * 60,
    'TRANSFER',
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Change vers la réserve voyages'
        WHEN 'de' THEN 'Umtausch in die Reiserücklage'
        WHEN 'es' THEN 'Cambio a la reserva de viajes'
        WHEN 'uk' THEN 'Обмін у резерв на подорожі'
        ELSE 'Exchange to Travel Reserve'
    END,
    unixepoch(date('now')) - 7 * 86400 + 780 * 60,
    '',
    5,
    6,
    (SELECT transfer_rate FROM overlay_rate),
    0
FROM overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    11100,
    unixepoch(date('now')) - 7 * 86400 + 780 * 60,
    unixepoch(date('now')) - 7 * 86400 + 780 * 60,
    'CREDIT',
    5,
    7,
    1110,
    500000000,
    1.0,
    'USER',
    'PRIMARY'
UNION ALL
SELECT
    11101,
    unixepoch(date('now')) - 7 * 86400 + 780 * 60,
    unixepoch(date('now')) - 7 * 86400 + 780 * 60,
    'DEBIT',
    6,
    7,
    1110,
    CAST(500000000 * (SELECT transfer_rate FROM overlay_rate) AS INTEGER),
    (SELECT transfer_rate FROM overlay_rate),
    'USER',
    'PRIMARY';

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    100 + overlay_account.id,
    unixepoch('now') - 300 * 86400,
    unixepoch('now') - 300 * 86400,
    overlay_account.id,
    overlay_account.balance - COALESCE((
        SELECT SUM(CASE WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount ELSE -transaction_entries.amount END)
        FROM transaction_entries
        WHERE transaction_entries.account_id = overlay_account.id
    ), 0)
FROM overlay_account;

DROP TABLE overlay_transaction;
DROP TABLE overlay_account;
DROP TABLE overlay_rate;
DROP TABLE overlay_locale;
