-- Store-screenshot showcase dataset.
--
-- Applied on top of a fully migrated Budgie database (see build-showcase.sh).
-- Clears every business row and inserts a curated, single-currency (USD)
-- dataset: 4 accounts, 81 transactions across the last 45 days, 5 tags and
-- 2 monthly budgets. Locale overlays (en.sql / fr.sql / uk.sql / de.sql /
-- es.sql) rename the rows and switch the currency; shift-dates.sql moves the
-- whole dataset so the newest transaction lands on the capture day.
--
-- Amounts are micro-units (PRECISION = 1_000_000), dates are epoch seconds.
-- Anchor day 1788220800 = 2026-09-01T00:00:00Z is "today" before shifting.

PRAGMA foreign_keys = OFF;

DELETE FROM transaction_tags;
DELETE FROM transaction_entries;
DELETE FROM transactions;
DELETE FROM tags;
DELETE FROM budget_category_limits;
DELETE FROM budgets;
DELETE FROM account_balances;
DELETE FROM debt_events;
DELETE FROM rule_actions;
DELETE FROM rule_conditions;
DELETE FROM rules;
DELETE FROM merchant_embedding_tags;
DELETE FROM comment_embedding_tags;
DELETE FROM merchant_embeddings;
DELETE FROM comment_embeddings;
DELETE FROM bank_integrations;
DELETE FROM bank_syncs;
DELETE FROM accounts;

-- The showcase is single-currency in every locale, so the base fixture's
-- 15 years of FX history is dead weight (10 MB of a 12 MB file). Keep only the
-- last anchor year for the three currencies the locale overlays switch between
-- (USD = 1, EUR = 2, UAH = 33).
DELETE FROM historical_exchange_rates
WHERE source_instrument_id NOT IN (1, 2, 33)
   OR target_instrument_id NOT IN (1, 2, 33)
   OR rate_date < date('2026-09-01', '-1 year');

DELETE FROM sqlite_sequence
WHERE name IN (
    'accounts',
    'account_balances',
    'bank_integrations',
    'bank_syncs',
    'budget_category_limits',
    'budgets',
    'comment_embeddings',
    'debt_events',
    'merchant_embeddings',
    'rule_actions',
    'rule_conditions',
    'rules',
    'tags',
    'transaction_entries',
    'transactions'
);

-- Accounts. Icons are already in their post-0043 form so re-running the
-- default-icon repair migration is a no-op.
INSERT INTO accounts (id, created_at, updated_at, icon, "order", title, title_search, type, nature, debt_type, instrument_id, target_balance, include_in_net_worth, is_active)
VALUES
    (1, 1788220800 - 400 * 86400, 1788220800 - 400 * 86400, 'Landmark',   0, 'Main Checking',     'main checking',     'BANK',    'LIABILITY', 'LENT', 1, 0, 1, 1),
    (2, 1788220800 - 400 * 86400, 1788220800 - 400 * 86400, 'Banknote',   1, 'Cash Wallet',       'cash wallet',       'CASH',    'LIABILITY', 'LENT', 1, 0, 1, 1),
    (3, 1788220800 - 400 * 86400, 1788220800 - 400 * 86400, 'PiggyBank',  2, 'Emergency Savings', 'emergency savings', 'SAVINGS', 'LIABILITY', 'LENT', 1, 0, 1, 1),
    (4, 1788220800 - 400 * 86400, 1788220800 - 400 * 86400, 'CreditCard', 3, 'Travel Card',       'travel card',       'BANK',    'LIABILITY', 'LENT', 1, 0, 1, 1);

INSERT INTO tags (id, created_at, updated_at, title, title_search)
VALUES
    (1, 1788220800 - 200 * 86400, 1788220800 - 200 * 86400, 'Work',         'work'),
    (2, 1788220800 - 200 * 86400, 1788220800 - 200 * 86400, 'Family',       'family'),
    (3, 1788220800 - 200 * 86400, 1788220800 - 200 * 86400, 'Weekend',      'weekend'),
    (4, 1788220800 - 200 * 86400, 1788220800 - 200 * 86400, 'Subscription', 'subscription'),
    (5, 1788220800 - 200 * 86400, 1788220800 - 200 * 86400, 'Health',       'health');

-- Staging tables. `day` counts back from the anchor day, `minute` is the
-- minute of day, `amount` is micro-units.
CREATE TEMP TABLE showcase_expense (id INTEGER, day INTEGER, minute INTEGER, account_id INTEGER, category_id INTEGER, title TEXT, amount INTEGER);
CREATE TEMP TABLE showcase_income (id INTEGER, day INTEGER, minute INTEGER, account_id INTEGER, category_id INTEGER, title TEXT, amount INTEGER);
CREATE TEMP TABLE showcase_transfer (id INTEGER, day INTEGER, minute INTEGER, from_account_id INTEGER, to_account_id INTEGER, title TEXT, amount INTEGER);

INSERT INTO showcase_expense (id, day, minute, account_id, category_id, title, amount) VALUES
    (101,  0,  405, 2, 12, 'Blue Bottle Coffee',      5400000),
    (102,  0,  490, 1, 13, 'Uber',                   18600000),
    (103,  1, 1105, 1, 11, 'Whole Foods Market',     86320000),
    (104,  1,  760, 2, 12, 'Sweetgreen',             14750000),
    (105,  2,  540, 1, 10, 'Rent',                 1450000000),
    (106,  2, 1140, 4, 24, 'AMC Theatres',           32000000),
    (107,  3, 1015, 1, 11, 'Trader Joe''s',          54180000),
    (108,  3, 1230, 1, 12, 'Shake Shack',            23400000),
    (109,  4,  620, 1, 14, 'Shell Gas Station',      48900000),
    (110,  4, 1080, 2, 34, 'Great Clips',            28000000),
    (111,  5,  700, 1, 22, 'Amazon',                 64990000),
    (112,  5, 1170, 4, 12, 'Chipotle',               16850000),
    (113,  6,  555, 1, 13, 'MTA Subway',             33000000),
    (114,  6, 1020, 1, 11, 'Whole Foods Market',     72440000),
    (115,  7,  840, 1, 23, 'Spotify Premium',        11990000),
    (116,  7, 1200, 4, 24, 'Steam',                  29990000),
    (117,  8,  585, 2, 12, 'Starbucks',               7250000),
    (151,  8,  660, 1, 23, 'Adobe Creative Cloud',   54990000),
    (118,  8, 1110, 1, 36, 'Equinox Gym',            89000000),
    (119,  9,  930, 1, 11, 'Costco',                148760000),
    (120,  9, 1260, 1, 12, 'Joe''s Pizza',           19500000),
    (121, 10,  610, 1, 15, 'CVS Pharmacy',           42300000),
    (122, 10, 1140, 4, 37, 'Uniqlo',                 78500000),
    (123, 11,  495, 2, 12, 'Blue Bottle Coffee',      5400000),
    (124, 11, 1035, 1, 13, 'Lyft',                   24700000),
    (125, 12,  750, 1, 11, 'Trader Joe''s',          63900000),
    (126, 12, 1290, 1, 24, 'Brooklyn Bowl',          45000000),
    (127, 13,  660, 1, 10, 'Con Edison',             96400000),
    (128, 13, 1155, 4, 12, 'Thai Villa',             52300000),
    (129, 14,  570, 1, 10, 'Verizon Fios',           74990000),
    (130, 14, 1080, 2, 28, 'Petco',                  36200000),
    (131, 15,  900, 1, 11, 'Whole Foods Market',     91150000),
    (132, 15, 1245, 1, 12, 'Ramen Ichiban',          28600000),
    (133, 16,  645, 1, 14, 'Shell Gas Station',      52100000),
    (134, 16, 1110, 4, 22, 'Best Buy',              129990000),
    (135, 17,  525, 2, 12, 'Starbucks',               6850000),
    (136, 17, 1020, 1, 13, 'MTA Subway',             33000000),
    (137, 18,  780, 1, 11, 'Trader Joe''s',          58340000),
    (138, 18, 1260, 1, 24, 'AMC Theatres',           27500000),
    (139, 19,  600, 1, 23, 'iCloud+ Storage',         9990000),
    (140, 19, 1140, 4, 12, 'Sushi Nakamura',         68000000),
    (141, 20,  555, 1, 15, 'Dr. Lin Dental',        165000000),
    (142, 20, 1065, 2, 34, 'Sephora',                44900000),
    (143, 21,  720, 1, 11, 'Whole Foods Market',     79630000),
    (144, 21, 1200, 1, 12, 'Shake Shack',            21100000),
    (145, 22,  630, 1, 22, 'Amazon',                 38450000),
    (146, 22, 1125, 4, 24, 'Barclays Center',        96000000),
    (147, 23,  585, 2, 12, 'Blue Bottle Coffee',      5400000),
    (148, 23, 1050, 1, 13, 'Uber',                   21350000),
    (149, 24,  810, 1, 11, 'Costco',                132280000),
    (150, 24, 1215, 4, 12, 'Trattoria Dell''Arte',   84200000),
    (152, 25, 1140, 1, 26, 'Charity: Water',         50000000),
    (153, 26,  540, 1, 14, 'Shell Gas Station',      46750000),
    (154, 26, 1095, 2, 28, 'Petco',                  28900000),
    (155, 27,  750, 1, 11, 'Trader Joe''s',          67420000),
    (156, 27, 1260, 1, 24, 'Comedy Cellar',          38000000),
    (157, 28,  615, 1, 37, 'Nike Store',            112000000),
    (158, 28, 1170, 4, 12, 'Chipotle',               18250000),
    (159, 29,  570, 2, 12, 'Starbucks',               7250000),
    (160, 29, 1035, 1, 13, 'MTA Subway',             33000000),
    (161, 30,  900, 1, 11, 'Whole Foods Market',     84900000),
    (162, 31,  645, 1, 15, 'Blue Cross Copay',       35000000),
    (163, 32,  540, 1, 10, 'Rent',                 1450000000),
    (164, 33,  690, 1, 11, 'Trader Joe''s',          61550000),
    (165, 34,  600, 1, 23, 'Spotify Premium',        11990000),
    (166, 35,  780, 1, 11, 'Costco',                118620000),
    (167, 36,  555, 1, 14, 'Shell Gas Station',      44200000),
    (168, 37,  660, 1, 10, 'Con Edison',             88700000),
    (169, 38,  930, 4, 22, 'IKEA',                  156400000),
    (170, 39,  615, 1, 36, 'Equinox Gym',            89000000),
    (171, 40, 1110, 1, 13, 'Uber',                   19800000),
    (172, 41, 1215, 1, 29, 'Delta Air Lines',       386000000),
    (173, 42,  645, 1, 10, 'Verizon Fios',           74990000),
    (174, 43, 1080, 2, 37, 'Uniqlo',                 64900000),
    (175, 44,  690, 1, 22, 'Target',                 87250000);

INSERT INTO showcase_income (id, day, minute, account_id, category_id, title, amount) VALUES
    (201,  1, 540, 1, 20, 'Acme Corp Payroll',    4250000000),
    (202, 12, 860, 1, 21, 'Freelance Project',     900000000),
    (203, 32, 540, 1, 20, 'Acme Corp Payroll',    4250000000);

INSERT INTO showcase_transfer (id, day, minute, from_account_id, to_account_id, title, amount) VALUES
    (301,  2, 600, 1, 3, 'To Emergency Savings',  800000000),
    (302, 16, 720, 1, 2, 'Cash Withdrawal',       200000000),
    (303, 33, 600, 1, 3, 'To Emergency Savings',  800000000);

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT id, 1788220800 - day * 86400 + minute * 60, 1788220800 - day * 86400 + minute * 60, 'EXPENSE', title, 1788220800 - day * 86400 + minute * 60, '', account_id, NULL, 1.0, 0
FROM showcase_expense;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT id, 1788220800 - day * 86400 + minute * 60, 1788220800 - day * 86400 + minute * 60, 'INCOME', title, 1788220800 - day * 86400 + minute * 60, '', NULL, account_id, 1.0, 0
FROM showcase_income;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT id, 1788220800 - day * 86400 + minute * 60, 1788220800 - day * 86400 + minute * 60, 'TRANSFER', title, 1788220800 - day * 86400 + minute * 60, '', from_account_id, to_account_id, 1.0, 0
FROM showcase_transfer;

INSERT INTO transaction_entries (created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 1788220800 - day * 86400 + minute * 60, 1788220800 - day * 86400 + minute * 60, 'CREDIT', account_id, category_id, id, amount, 1.0, 'USER', 'PRIMARY'
FROM showcase_expense;

INSERT INTO transaction_entries (created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 1788220800 - day * 86400 + minute * 60, 1788220800 - day * 86400 + minute * 60, 'DEBIT', account_id, category_id, id, amount, 1.0, 'USER', 'PRIMARY'
FROM showcase_income;

INSERT INTO transaction_entries (created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 1788220800 - day * 86400 + minute * 60, 1788220800 - day * 86400 + minute * 60, 'CREDIT', from_account_id, 7, id, amount, 1.0, 'USER', 'PRIMARY'
FROM showcase_transfer;

INSERT INTO transaction_entries (created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT 1788220800 - day * 86400 + minute * 60, 1788220800 - day * 86400 + minute * 60, 'DEBIT', to_account_id, 7, id, amount, 1.0, 'USER', 'PRIMARY'
FROM showcase_transfer;

INSERT INTO transaction_tags (transaction_id, tag_id, is_primary) VALUES
    (102, 1, 1),
    (113, 1, 1),
    (136, 1, 1),
    (160, 1, 1),
    (201, 1, 1),
    (202, 1, 1),
    (203, 1, 1),
    (105, 2, 1),
    (119, 2, 1),
    (130, 2, 1),
    (149, 2, 1),
    (154, 2, 1),
    (106, 3, 1),
    (126, 3, 1),
    (138, 3, 1),
    (146, 3, 1),
    (156, 3, 1),
    (115, 4, 1),
    (139, 4, 1),
    (151, 4, 1),
    (165, 4, 1),
    (121, 5, 1),
    (141, 5, 1),
    (162, 5, 1),
    (170, 5, 1);

-- Budgets. `period_start_day` is rewritten by shift-dates.sql so the current
-- period is always ~20 days in when a screenshot is captured.
INSERT INTO budgets (id, created_at, updated_at, name, period, period_start_day, use_last_day_of_month, overall_limit, other_limit, instrument_id)
VALUES
    (1, 1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 'Everyday Essentials', 'MONTHLY', 1, 0, 4030000000, 1350000000, 1),
    (2, 1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 'Lifestyle & Fun',     'MONTHLY', 1, 0, 5900000000, 4700000000, 1);

INSERT INTO budget_category_limits (created_at, updated_at, budget_id, category_id, limit_amount)
VALUES
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 1, 10, 1700000000),
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 1, 11,  700000000),
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 1, 13,  150000000),
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 1, 14,  130000000),
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 2, 12,  380000000),
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 2, 22,  400000000),
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 2, 23,  100000000),
    (1788220800 - 120 * 86400, 1788220800 - 120 * 86400, 2, 24,  320000000);

-- Opening balances. The snapshot predates every entry, so the app adds the
-- whole ledger on top of it and lands on the intended visible balance.
CREATE TEMP TABLE showcase_balance (account_id INTEGER, amount INTEGER);

INSERT INTO showcase_balance (account_id, amount) VALUES
    (1,  4862400000),
    (2,   186500000),
    (3, 12450000000),
    (4,  -642800000);

INSERT INTO account_balances (created_at, updated_at, account_id, amount)
SELECT
    1788220800 - 60 * 86400,
    1788220800 - 60 * 86400,
    showcase_balance.account_id,
    showcase_balance.amount - COALESCE((
        SELECT SUM(CASE WHEN transaction_entries.type = 'DEBIT' THEN transaction_entries.amount ELSE -transaction_entries.amount END)
        FROM transaction_entries
        WHERE transaction_entries.account_id = showcase_balance.account_id
    ), 0)
FROM showcase_balance;

UPDATE settings
SET
    default_account_id = 1,
    default_instrument_id = 1,
    show_cents = 1,
    apply_mcc_default_category = 1,
    is_budget_widget_enabled = 1,
    is_budget_push_enabled = 0,
    is_vibration_enabled = 1,
    is_pin_enabled = 0,
    is_biometric_enabled = 0,
    is_screenshot_protection_enabled = 0,
    updated_at = 1788220800;

DROP TABLE showcase_expense;
DROP TABLE showcase_income;
DROP TABLE showcase_transfer;
DROP TABLE showcase_balance;

PRAGMA foreign_keys = ON;
