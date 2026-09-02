-- Scene overlay: crypto accounts with a live fiat market value.
--
-- A crypto account is `accounts.type = 'CRYPTO'` with `instrument_id` pointing
-- at a CRYPTO instrument. The base fixture already ships the CoinGecko-backed
-- instrument rows (BTC = 34, XMR = 51, both `price_provider = 'COINGECKO'`),
-- so this overlay only has to supply
--
--   * the holdings (balances are micro-units of the coin, not of fiat),
--   * an `exchange_rates` row per coin against the locale's display currency,
--     which is what converts the holding into the net-worth total, and
--   * a 90-day `instrument_daily_market_prices` series ending today, because
--     the committed fixture's series stops months before any capture day.
--
-- Coin prices are derived from the USD price times the fixture's own USD -> base
-- rate, so every locale gets a self-consistent valuation instead of five
-- hand-maintained numbers.
--
-- Account id 9 is pinned to the Bitcoin wallet, because the landing capture
-- config deep-links it as `budgie://account/9/details`.
--
-- Owns accounts 9-10, account_balances 109-110, exchange_rates 103-106 and
-- transactions 1400-1499.

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

CREATE TEMP TABLE overlay_coin AS
SELECT 34 AS instrument_id, 118420.55 AS usd_price, 421500 AS holding, 9 AS account_id, 'Bitcoin' AS coin_title
UNION ALL
SELECT 51, 412.80, 12500000, 10, 'Monero';

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1400 AND 1499;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1400 AND 1499;
DELETE FROM transactions WHERE id BETWEEN 1400 AND 1499;
DELETE FROM account_balances WHERE account_id BETWEEN 9 AND 10;
DELETE FROM accounts WHERE id BETWEEN 9 AND 10;
DELETE FROM exchange_rates
WHERE (base_instrument_id IN (34, 51) AND quote_instrument_id = (SELECT instrument_id FROM overlay_locale))
   OR (quote_instrument_id IN (34, 51) AND base_instrument_id = (SELECT instrument_id FROM overlay_locale));

INSERT INTO exchange_rates (id, created_at, updated_at, source, base_instrument_id, quote_instrument_id, rate)
SELECT
    103 + (overlay_coin.account_id - 9) * 2,
    unixepoch('now') - 900,
    unixepoch('now') - 900,
    'coingecko.com',
    overlay_coin.instrument_id,
    overlay_locale.instrument_id,
    overlay_coin.usd_price * overlay_locale.usd_to_base
FROM overlay_coin
CROSS JOIN overlay_locale
UNION ALL
SELECT
    104 + (overlay_coin.account_id - 9) * 2,
    unixepoch('now') - 900,
    unixepoch('now') - 900,
    'coingecko.com',
    overlay_locale.instrument_id,
    overlay_coin.instrument_id,
    1.0 / (overlay_coin.usd_price * overlay_locale.usd_to_base)
FROM overlay_coin
CROSS JOIN overlay_locale;

INSERT INTO accounts (
    id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type,
    instrument_id, target_balance, include_in_net_worth, is_active
)
SELECT
    overlay_coin.account_id,
    unixepoch('now') - 400 * 86400,
    unixepoch('now') - 2 * 86400,
    CASE overlay_coin.instrument_id WHEN 34 THEN 'Bitcoin' ELSE 'Coins' END,
    overlay_coin.account_id,
    CASE overlay_locale.language
        WHEN 'fr' THEN 'Portefeuille ' || overlay_coin.coin_title
        WHEN 'de' THEN overlay_coin.coin_title || '-Wallet'
        WHEN 'es' THEN 'Cartera de ' || overlay_coin.coin_title
        WHEN 'uk' THEN 'Гаманець ' || overlay_coin.coin_title
        ELSE overlay_coin.coin_title || ' Wallet'
    END,
    lower(CASE overlay_locale.language
        WHEN 'fr' THEN 'Portefeuille ' || overlay_coin.coin_title
        WHEN 'de' THEN overlay_coin.coin_title || '-Wallet'
        WHEN 'es' THEN 'Cartera de ' || overlay_coin.coin_title
        WHEN 'uk' THEN 'Гаманець ' || overlay_coin.coin_title
        ELSE overlay_coin.coin_title || ' Wallet'
    END),
    'CRYPTO',
    'ASSET',
    'LENT',
    overlay_coin.instrument_id,
    0,
    1,
    1
FROM overlay_coin
CROSS JOIN overlay_locale;

-- Two buys per wallet. Amounts are coin micro-units, so they are not scaled by
-- the locale overlay's fiat multiplier.
CREATE TEMP TABLE overlay_transaction (
    id INTEGER,
    account_id INTEGER,
    days_ago INTEGER,
    minute INTEGER,
    amount INTEGER,
    title_en TEXT,
    title_fr TEXT,
    title_de TEXT,
    title_es TEXT,
    title_uk TEXT
);

INSERT INTO overlay_transaction (id, account_id, days_ago, minute, amount, title_en, title_fr, title_de, title_es, title_uk) VALUES
    (1400, 9, 12,  840,  62000, 'Bitcoin buy',  'Achat Bitcoin', 'Bitcoin-Kauf', 'Compra de Bitcoin', 'Купівля Bitcoin'),
    (1401, 9, 47,  915,  88500, 'Bitcoin buy',  'Achat Bitcoin', 'Bitcoin-Kauf', 'Compra de Bitcoin', 'Купівля Bitcoin'),
    (1402, 10, 23, 1020, 2500000, 'Monero buy',  'Achat Monero',  'Monero-Kauf',  'Compra de Monero',  'Купівля Monero'),
    (1403, 10, 68,  690, 4000000, 'Monero buy',  'Achat Monero',  'Monero-Kauf',  'Compra de Monero',  'Купівля Monero');

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_transaction.id,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'INCOME',
    CASE overlay_locale.language
        WHEN 'fr' THEN overlay_transaction.title_fr
        WHEN 'de' THEN overlay_transaction.title_de
        WHEN 'es' THEN overlay_transaction.title_es
        WHEN 'uk' THEN overlay_transaction.title_uk
        ELSE overlay_transaction.title_en
    END,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    '',
    NULL,
    overlay_transaction.account_id,
    1.0,
    0
FROM overlay_transaction
CROSS JOIN overlay_locale;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_transaction.id * 10,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    unixepoch(date('now')) - overlay_transaction.days_ago * 86400 + overlay_transaction.minute * 60,
    'DEBIT',
    overlay_transaction.account_id,
    3,
    overlay_transaction.id,
    overlay_transaction.amount,
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_transaction;

INSERT INTO account_balances (id, created_at, updated_at, account_id, amount)
SELECT
    100 + overlay_coin.account_id,
    unixepoch('now') - 400 * 86400,
    unixepoch('now') - 400 * 86400,
    overlay_coin.account_id,
    overlay_coin.holding - COALESCE((
        SELECT SUM(transaction_entries.amount)
        FROM transaction_entries
        WHERE transaction_entries.account_id = overlay_coin.account_id
          AND transaction_entries.type = 'DEBIT'
    ), 0)
FROM overlay_coin;

-- A 90-day price series ending today. `INSERT OR REPLACE` keeps the unique
-- (instrument, quote, date) triple stable, which is what makes a re-run a no-op
-- even where it overlaps the committed history.
INSERT OR REPLACE INTO instrument_daily_market_prices (instrument_id, quote_instrument_id, price_date, price, source)
WITH RECURSIVE day_offset(days_ago) AS (
    SELECT 0
    UNION ALL
    SELECT days_ago + 1 FROM day_offset WHERE days_ago < 89
)
SELECT
    overlay_coin.instrument_id,
    overlay_locale.instrument_id,
    date('now', '-' || day_offset.days_ago || ' days'),
    overlay_coin.usd_price * overlay_locale.usd_to_base * (1.0 - day_offset.days_ago * 0.0016),
    'COINGECKO'
FROM day_offset
CROSS JOIN overlay_coin
CROSS JOIN overlay_locale;

DROP TABLE overlay_transaction;
DROP TABLE overlay_coin;
DROP TABLE overlay_locale;
