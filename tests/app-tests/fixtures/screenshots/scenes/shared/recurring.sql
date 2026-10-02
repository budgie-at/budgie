-- Adds three subscriptions that bill on the 15th of every month for the last eight months.

CREATE TEMP TABLE overlay_locale AS
SELECT
    settings.language AS language,
    CASE settings.language WHEN 'uk' THEN 15.0 WHEN 'en' THEN 1.0 ELSE 0.92 END AS amount_scale,
    CASE settings.language WHEN 'uk' THEN 1000000 ELSE 10000 END AS rounding_unit
FROM settings;

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 2500 AND 2599;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 2500 AND 2599;
DELETE FROM transactions WHERE id BETWEEN 2500 AND 2599;

CREATE TEMP TABLE overlay_subscription (slot INTEGER, category_id INTEGER, base_amount INTEGER, title TEXT);

INSERT INTO overlay_subscription (slot, category_id, base_amount, title) VALUES
    (0, 23, 15990000, 'Netflix'),
    (1, 23, 10990000, 'Spotify'),
    (2, 36, 39000000, 'Gym Membership');

CREATE TEMP TABLE overlay_month (months_ago INTEGER);

INSERT INTO overlay_month (months_ago) VALUES (1), (2), (3), (4), (5), (6), (7), (8);

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    2500 + overlay_subscription.slot * 10 + overlay_month.months_ago,
    unixepoch(date('now', 'start of month', '-' || overlay_month.months_ago || ' months', '+14 days')) + 43200,
    unixepoch(date('now', 'start of month', '-' || overlay_month.months_ago || ' months', '+14 days')) + 43200,
    'EXPENSE',
    overlay_subscription.title,
    unixepoch(date('now', 'start of month', '-' || overlay_month.months_ago || ' months', '+14 days')) + 43200,
    '',
    1,
    NULL,
    1.0,
    0
FROM overlay_subscription
CROSS JOIN overlay_month;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    25000 + overlay_subscription.slot * 10 + overlay_month.months_ago,
    unixepoch(date('now', 'start of month', '-' || overlay_month.months_ago || ' months', '+14 days')) + 43200,
    unixepoch(date('now', 'start of month', '-' || overlay_month.months_ago || ' months', '+14 days')) + 43200,
    'CREDIT',
    1,
    overlay_subscription.category_id,
    2500 + overlay_subscription.slot * 10 + overlay_month.months_ago,
    CAST(ROUND(overlay_subscription.base_amount * overlay_locale.amount_scale / overlay_locale.rounding_unit) * overlay_locale.rounding_unit AS INTEGER),
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_subscription
CROSS JOIN overlay_month
CROSS JOIN overlay_locale;

DROP TABLE overlay_month;
DROP TABLE overlay_subscription;
DROP TABLE overlay_locale;
