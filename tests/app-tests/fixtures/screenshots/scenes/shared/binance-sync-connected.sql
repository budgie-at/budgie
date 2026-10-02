-- Adds a connected Binance integration with CRYPTO_SYNC wallets, sync status, spot trades and a 90-day market price history.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    (SELECT instrument_id FROM accounts WHERE id = 1) AS instrument_id,
    COALESCE((
        SELECT exchange_rates.rate
        FROM exchange_rates
        WHERE exchange_rates.base_instrument_id = 1
          AND exchange_rates.quote_instrument_id = (SELECT instrument_id FROM accounts WHERE id = 1)
          AND exchange_rates.deleted_at IS NULL
    ), 1.0) AS usd_to_base
FROM settings;

CREATE TEMP TABLE overlay_asset (
    account_id INTEGER,
    instrument_id INTEGER,
    wallet TEXT,
    asset TEXT,
    usd_price REAL,
    holding INTEGER,
    circulating_supply REAL,
    daily_volume_units REAL,
    daily_drift REAL,
    wobble_divisor REAL,
    transaction_count INTEGER
);

INSERT INTO overlay_asset (account_id, instrument_id, wallet, asset, usd_price, holding, circulating_supply, daily_volume_units, daily_drift, wobble_divisor, transaction_count) VALUES
    (20, 35, 'SPOT',    'ETH',  4185.60,       3420000,      120700000.0,       640000.0, 0.00160,   420.0, 186),
    (21, 40, 'SPOT',    'SOL',   214.35,      46800000,      588000000.0,      3200000.0, 0.00210,   360.0, 94),
    (22, 36, 'FUNDING', 'USDT',    1.0002, 2480000000, 183000000000.0, 95000000000.0, 0.00001, 26000.0, 41);

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 9100 AND 9199;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 9100 AND 9199;
DELETE FROM transactions WHERE id BETWEEN 9100 AND 9199;
DELETE FROM bank_syncs WHERE account_id BETWEEN 20 AND 22;
DELETE FROM account_balances WHERE account_id BETWEEN 20 AND 22;
DELETE FROM accounts WHERE id BETWEEN 20 AND 22;
DELETE FROM bank_integrations WHERE id = 3;
DELETE FROM bank_integrations WHERE provider = 'BINANCE';
DELETE FROM exchange_rates
WHERE (base_instrument_id IN (SELECT instrument_id FROM overlay_asset) AND quote_instrument_id = (SELECT instrument_id FROM overlay_locale))
   OR (quote_instrument_id IN (SELECT instrument_id FROM overlay_asset) AND base_instrument_id = (SELECT instrument_id FROM overlay_locale));

INSERT INTO bank_integrations (id, created_at, updated_at, provider, token)
VALUES (3, unixepoch('now') - 96 * 86400, unixepoch('now') - 420, 'BINANCE', '{"apiKey":"DEMO4pIk3yBiN4nC3Sh0wC4s3","apiSecret":"DEMOs3cR3tBiN4nC3Sh0wC4s3"}');

INSERT INTO exchange_rates (id, created_at, updated_at, source, base_instrument_id, quote_instrument_id, rate)
SELECT
    111 + (overlay_asset.account_id - 20) * 2,
    unixepoch('now') - 420,
    unixepoch('now') - 420,
    'binance.com',
    overlay_asset.instrument_id,
    overlay_locale.instrument_id,
    overlay_asset.usd_price * overlay_locale.usd_to_base
FROM overlay_asset
CROSS JOIN overlay_locale
UNION ALL
SELECT
    112 + (overlay_asset.account_id - 20) * 2,
    unixepoch('now') - 420,
    unixepoch('now') - 420,
    'binance.com',
    overlay_locale.instrument_id,
    overlay_asset.instrument_id,
    1.0 / (overlay_asset.usd_price * overlay_locale.usd_to_base)
FROM overlay_asset
CROSS JOIN overlay_locale;

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, external_id, external_source, integration_id, target_balance, include_in_net_worth, is_active
)
SELECT
    overlay_asset.account_id,
    unixepoch('now') - 96 * 86400,
    unixepoch('now') - 420,
    'Bitcoin',
    overlay_asset.account_id,
    'Binance ' || overlay_asset.wallet || ' · ' || overlay_asset.asset,
    lower('Binance ' || overlay_asset.wallet || ' · ' || overlay_asset.asset),
    'CRYPTO_SYNC',
    'LIABILITY',
    'LENT',
    overlay_asset.instrument_id,
    overlay_asset.wallet || ':' || overlay_asset.asset,
    'BINANCE',
    3,
    0,
    1,
    1
FROM overlay_asset;

INSERT INTO bank_syncs (
    id, created_at, updated_at, account_id, provider, enabled, mode, status,
    backward_synced_at, backward_sync_from_at, forward_synced_at, forward_sync_from_at,
    transaction_count, error_count
)
SELECT
    overlay_asset.account_id,
    unixepoch('now') - 96 * 86400,
    unixepoch('now') - 420,
    overlay_asset.account_id,
    'BINANCE',
    1,
    'FORWARD',
    'IDLE',
    unixepoch('now') - 95 * 86400,
    unixepoch('now') - 96 * 86400,
    unixepoch('now') - 420,
    unixepoch('now') - 90 * 86400,
    overlay_asset.transaction_count,
    0
FROM overlay_asset;

CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    account_id INTEGER,
    type TEXT,
    category_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    fee_amount INTEGER,
    quoted_usd_amount INTEGER,
    quoted_usd_unit_price INTEGER,
    external_id TEXT,
    title TEXT
);

INSERT INTO overlay_transaction (id, account_id, type, category_id, days_ago, minute, amount, fee_amount, quoted_usd_amount, quoted_usd_unit_price, external_id, title) VALUES
    (9100, 20, 'INCOME',  19,  1,   30,       1842,    0,         0,       0, 'binance:earn:ETH:{date}',                  'Binance Earn reward ETH'),
    (9101, 20, 'INCOME',  19,  2,   30,       1836,    0,         0,       0, 'binance:earn:ETH:{date}',                  'Binance Earn reward ETH'),
    (9102, 21, 'INCOME',   8,  9,  745,   12500000,    0,         0,       0, '9182734655',                               'Binance SOL deposit'),
    (9103, 20, 'EXPENSE',  8, 47, 1020,     750000, 1200,         0,       0, '4471902',                                  'Binance ETH withdrawal'),
    (9104, 22, 'INCOME',   3, 14,  880,  800000000,    0, 812000000, 1015000, 'binance:c2c:20831742998877665544',         'Binance P2P buy USDT'),
    (9105, 22, 'INCOME',   3, 44,  655, 1200000000,    0, 1230000000, 1025000, 'binance:c2c:20718033445566778899',        'Binance P2P buy USDT');

INSERT INTO transactions (id, created_at, updated_at, type, title, external_id, operated_at, comment, from_account_id, to_account_id, exchange_rate, external_source, needs_embedding)
SELECT
    overlay_transaction.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    overlay_transaction.type,
    overlay_transaction.title,
    REPLACE(overlay_transaction.external_id, '{date}', date('now', '-' || overlay_transaction.days_ago || ' days')),
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    '',
    CASE overlay_transaction.type WHEN 'EXPENSE' THEN overlay_transaction.account_id END,
    CASE overlay_transaction.type WHEN 'INCOME' THEN overlay_transaction.account_id END,
    1.0,
    'BINANCE',
    0
FROM overlay_transaction;

INSERT INTO transaction_entries (
    id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, external_id,
    exchange_rate, category_source, kind, quoted_instrument_id, quoted_amount, quoted_unit_price
)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    CASE overlay_transaction.type WHEN 'INCOME' THEN 'DEBIT' ELSE 'CREDIT' END,
    overlay_transaction.account_id,
    overlay_transaction.category_id,
    overlay_transaction.id,
    overlay_transaction.amount - overlay_transaction.fee_amount,
    REPLACE(overlay_transaction.external_id, '{date}', date('now', '-' || overlay_transaction.days_ago || ' days')),
    1.0,
    'USER',
    'PRIMARY',
    CASE WHEN overlay_transaction.quoted_usd_amount > 0 THEN overlay_locale.instrument_id END,
    CASE WHEN overlay_transaction.quoted_usd_amount > 0 THEN CAST(overlay_transaction.quoted_usd_amount * overlay_locale.usd_to_base AS INTEGER) END,
    CASE WHEN overlay_transaction.quoted_usd_amount > 0 THEN CAST(overlay_transaction.quoted_usd_unit_price * overlay_locale.usd_to_base AS INTEGER) END
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (
    id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, external_id,
    exchange_rate, category_source, kind
)
SELECT
    overlay_transaction.id * 10 + 2,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'FEE',
    overlay_transaction.account_id,
    32,
    overlay_transaction.id,
    overlay_transaction.fee_amount,
    REPLACE(overlay_transaction.external_id, '{date}', date('now', '-' || overlay_transaction.days_ago || ' days')) || ':fee',
    1.0,
    'FEE',
    'PRIMARY'
FROM overlay_transaction
WHERE overlay_transaction.fee_amount > 0;

CREATE TEMP TABLE overlay_transfer (
    id INTEGER,
    from_account_id INTEGER,
    to_account_id INTEGER,
    fee_account_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    from_amount INTEGER,
    to_amount INTEGER,
    fee_amount INTEGER,
    external_id TEXT,
    title TEXT
);

INSERT INTO overlay_transfer (id, from_account_id, to_account_id, fee_account_id, days_ago, minute, from_amount, to_amount, fee_amount, external_id, title) VALUES
    (9110, 20, 21, 21,  3,  615, 512000, 10000000, 10000, 'binance:trade:SOLETH:41938827', 'Binance SOLETH buy'),
    (9111, 21, 20, NULL, 41, 1105, 6000000,  307200,     0, 'binance:convert:1841927365',   'Binance convert SOL to ETH');

INSERT INTO transactions (id, created_at, updated_at, type, title, external_id, operated_at, comment, from_account_id, to_account_id, exchange_rate, external_source, needs_embedding)
SELECT
    overlay_transfer.id,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    'TRANSFER',
    overlay_transfer.title,
    overlay_transfer.external_id,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    '',
    overlay_transfer.from_account_id,
    overlay_transfer.to_account_id,
    1.0,
    'BINANCE',
    0
FROM overlay_transfer;

INSERT INTO transaction_entries (
    id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, external_id,
    exchange_rate, category_source, kind
)
SELECT
    overlay_transfer.id * 10,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    'CREDIT',
    overlay_transfer.from_account_id,
    NULL,
    overlay_transfer.id,
    overlay_transfer.from_amount,
    overlay_transfer.external_id,
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transfer
UNION ALL
SELECT
    overlay_transfer.id * 10 + 1,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    'DEBIT',
    overlay_transfer.to_account_id,
    NULL,
    overlay_transfer.id,
    overlay_transfer.to_amount,
    overlay_transfer.external_id,
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transfer
UNION ALL
SELECT
    overlay_transfer.id * 10 + 2,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    unixepoch(date('now')) - overlay_transfer.days_ago * 86400 + overlay_transfer.minute * 60,
    'FEE',
    overlay_transfer.fee_account_id,
    32,
    overlay_transfer.id,
    overlay_transfer.fee_amount,
    overlay_transfer.external_id || ':fee',
    1.0,
    'FEE',
    'PRIMARY'
FROM overlay_transfer
WHERE overlay_transfer.fee_amount > 0 AND overlay_transfer.fee_account_id IS NOT NULL;

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    100 + overlay_asset.account_id,
    unixepoch('now') - 96 * 86400,
    unixepoch('now') - 96 * 86400,
    overlay_asset.account_id,
    overlay_asset.holding
FROM overlay_asset;

INSERT OR REPLACE INTO instrument_daily_market_prices (instrument_id, quote_instrument_id, price_date, price, market_cap, volume, source)
WITH RECURSIVE day_offset(days_ago) AS (
    SELECT 0
    UNION ALL
    SELECT days_ago + 1 FROM day_offset WHERE days_ago < 89
),
daily_price AS (
    SELECT
        overlay_asset.instrument_id AS instrument_id,
        overlay_locale.instrument_id AS quote_instrument_id,
        overlay_asset.circulating_supply AS circulating_supply,
        overlay_asset.daily_volume_units AS daily_volume_units,
        date('now', '-' || day_offset.days_ago || ' days') AS price_date,
        overlay_asset.usd_price * overlay_locale.usd_to_base
            * (1.0 - day_offset.days_ago * overlay_asset.daily_drift)
            * (1.0 + (((day_offset.days_ago * 29 + 13) % 19) - 9) / overlay_asset.wobble_divisor) AS price
    FROM day_offset
    CROSS JOIN overlay_asset
    CROSS JOIN overlay_locale
)
SELECT
    daily_price.instrument_id,
    daily_price.quote_instrument_id,
    daily_price.price_date,
    daily_price.price,
    daily_price.price * daily_price.circulating_supply,
    daily_price.price * daily_price.daily_volume_units,
    'BINANCE'
FROM daily_price;

DROP TABLE overlay_transfer;
DROP TABLE overlay_transaction;
DROP TABLE overlay_asset;
DROP TABLE overlay_locale;
