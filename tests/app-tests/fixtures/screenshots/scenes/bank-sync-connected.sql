-- Scene overlay: a connected Monobank integration.
--
-- Four rows make the integration render as connected rather than as a token
-- form:
--
--   * `bank_integrations` holds the provider and its token,
--   * the synced accounts carry `integration_id`, `external_source`,
--     `external_id` and an `iban`, which is what groups them under the bank
--     card on Home,
--   * one `bank_syncs` row per account (unique on `account_id`) drives the sync
--     card: `forward_synced_at` is the "last sync N minutes ago" stamp,
--     `backward_sync_from_at` is the resync window the picker edits,
--   * the imported transactions carry `external_id` + `external_source`, and
--     their entries carry `mcc_category_id` with
--     `category_source = 'MCC_DEFAULT'`, which is the MCC -> category state the
--     transaction edit screen shows.
--
-- Includes the Monobank jar (a savings pot exposed by the same API) and one
-- FEE entry, so the provider group has the same shape a real sync produces.
--
-- Owns bank_integrations 1, accounts 12-14, account_balances 112-114,
-- bank_syncs 1-3 and transactions 9000-9099. Transaction 9001 is the MCC-derived
-- grocery row the landing capture config edits by id.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    (SELECT instrument_id FROM accounts WHERE id = 1) AS instrument_id,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 9000 AND 9099;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 9000 AND 9099;
DELETE FROM transactions WHERE id BETWEEN 9000 AND 9099;
DELETE FROM bank_syncs WHERE account_id BETWEEN 12 AND 14;
DELETE FROM account_balances WHERE account_id BETWEEN 12 AND 14;
DELETE FROM accounts WHERE id BETWEEN 12 AND 14;
DELETE FROM bank_integrations WHERE id = 1;
DELETE FROM bank_integrations WHERE provider = 'MONOBANK';

INSERT INTO bank_integrations (id, created_at, updated_at, provider, token)
VALUES (1, unixepoch('now') - 210 * 86400, unixepoch('now') - 240, 'MONOBANK', 'uEXaMpLe_M0n0b4nk_T0k3n_D3m0');

CREATE TEMP TABLE overlay_account (
    id INTEGER,
    icon TEXT,
    type TEXT,
    external_id TEXT,
    iban TEXT,
    balance INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_account (id, icon, type, external_id, iban, balance, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (12, 'CreditCard', 'BANK_SYNC', 'mono_card_black_4149', 'UA213223130000026007233566001', 2184500000, 'Monobank Black',    'Monobank Black',       'Monobank Black',      'Monobank Black',       'Monobank Чорна'),
    (13, 'Wallet',     'BANK_SYNC', 'mono_card_white_9021', 'UA213223130000026007233566002',  742300000, 'Monobank White',    'Monobank White',       'Monobank White',      'Monobank White',       'Monobank Біла'),
    (14, 'PiggyBank',  'SAVINGS',   'mono_jar_newcar_7714', NULL,                            4310000000, 'Monobank Jar: Car', 'Cagnotte Monobank : voiture', 'Monobank-Sparziel: Auto', 'Hucha Monobank: coche', 'Банка Monobank: авто');

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, external_id, external_source, iban, integration_id, target_balance, include_in_net_worth, is_active
)
SELECT
    overlay_account.id,
    unixepoch('now') - 210 * 86400,
    unixepoch('now') - 240,
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
    overlay_locale.instrument_id,
    overlay_account.external_id,
    'MONOBANK',
    overlay_account.iban,
    1,
    0,
    1,
    1
FROM overlay_account
CROSS JOIN overlay_locale;

-- `forward_synced_at` four minutes ago is the "last sync" stamp the storyboard
-- asks for; `backward_sync_from_at` is the resync window the picker opens on.
INSERT INTO bank_syncs (
    id, created_at, updated_at, account_id, provider, enabled, mode, status,
    backward_synced_at, backward_sync_from_at, forward_synced_at, forward_sync_from_at,
    transaction_count, error_count
)
SELECT
    overlay_account.id - 11,
    unixepoch('now') - 210 * 86400,
    unixepoch('now') - 240,
    overlay_account.id,
    'MONOBANK',
    1,
    'FORWARD',
    'IDLE',
    unixepoch('now') - 209 * 86400,
    unixepoch('now') - 210 * 86400,
    unixepoch('now') - 240,
    unixepoch('now') - 90 * 86400,
    CASE overlay_account.id WHEN 12 THEN 412 WHEN 13 THEN 168 ELSE 24 END,
    0
FROM overlay_account;

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    account_id INTEGER,
    category_id INTEGER,
    mcc_category_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, account_id, category_id, mcc_category_id, days_ago, minute, amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (9001, 12, 11, 825, 0,  1055, 78400000, 'Silpo',            'Carrefour Market',   'REWE',              'Mercadona',          'Сільпо'),
    (9002, 12, 12, 870, 0,   745, 21600000, 'Aroma Kava',       'Café Coutume',       'Espresso House',    'Café Central',       'Aroma Kava'),
    (9003, 12, 13, 752, 1,   520, 12800000, 'Uklon',            'Navigo RATP',        'Deutsche Bahn',     'Cabify',             'Uklon'),
    (9004, 13, 14, 837, 2,   630, 64200000, 'WOG Fuel',         'TotalEnergies',      'Aral Tankstelle',   'Repsol',             'WOG'),
    (9005, 13, 15, 878, 4,  1140, 33500000, 'Apteka Dobrogo Dnya', 'Pharmacie Centrale', 'Apotheke am Markt', 'Farmacia Central', 'Аптека Доброго Дня'),
    (9006, 12, 24, 1019, 6, 1230, 29900000, 'Planeta Kino',     'UGC Ciné Cité',      'CineStar',          'Cinesa',             'Планета Кіно'),
    (9007, 12, 37, 854, 9,   980, 96500000, 'Intertop',         'Galeries Lafayette', 'Peek & Cloppenburg', 'El Corte Inglés',   'Intertop');

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
    'mono_tx_' || overlay_transaction.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    '',
    overlay_transaction.account_id,
    NULL,
    1.0,
    'MONOBANK',
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, mcc_category_id, transaction_id, amount, external_id, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'CREDIT',
    overlay_transaction.account_id,
    overlay_transaction.category_id,
    overlay_transaction.mcc_category_id,
    overlay_transaction.id,
    CAST(ROUND(overlay_transaction.amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    'mono_entry_' || overlay_transaction.id,
    1.0,
    'MCC_DEFAULT',
    'PRIMARY'
FROM overlay_transaction
CROSS JOIN overlay_locale;

-- The card-issuer commission Monobank reports alongside a purchase.
INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    90071,
    unixepoch(date('now')) - 9 * 86400 + 980 * 60,
    unixepoch(date('now')) - 9 * 86400 + 980 * 60,
    'FEE',
    12,
    32,
    9007,
    CAST(ROUND(1450000 * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'FEE',
    'PRIMARY'
FROM overlay_locale;

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    100 + overlay_account.id,
    unixepoch('now') - 210 * 86400,
    unixepoch('now') - 210 * 86400,
    overlay_account.id,
    CAST(ROUND(overlay_account.balance * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER)
        + COALESCE((
            SELECT SUM(transaction_entries.amount)
            FROM transaction_entries
            WHERE transaction_entries.account_id = overlay_account.id
              AND transaction_entries.type IN ('CREDIT', 'FEE')
        ), 0)
FROM overlay_account
CROSS JOIN overlay_locale;

DROP TABLE overlay_transaction;
DROP TABLE overlay_account;
DROP TABLE overlay_locale;
