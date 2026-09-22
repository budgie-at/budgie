-- Seeds a handful of past expense transactions anchored on the exact weekday
-- and minute-of-day the capture runs at, so the cold-open pattern suggestion
-- row (loadPatternBeforeCategorySelection) always has a category to show
-- regardless of when this scene is actually captured.

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 1800 AND 1899;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 1800 AND 1899;
DELETE FROM transactions WHERE id BETWEEN 1800 AND 1899;

CREATE TEMP TABLE overlay_pattern_transaction (
    id INTEGER,
    weeks_ago INTEGER,
    category_id INTEGER,
    amount INTEGER,
    title TEXT
);

INSERT INTO overlay_pattern_transaction (id, weeks_ago, category_id, amount, title) VALUES
    (1800, 1, 11, 42500000, 'Trader Joe''s'),
    (1801, 2, 11, 38900000, 'Trader Joe''s'),
    (1802, 3, 11, 41200000, 'Trader Joe''s'),
    (1803, 1, 13, 18000000, 'Metro Card'),
    (1804, 2, 13, 17500000, 'Metro Card'),
    (1805, 1, 24, 65000000, 'AMC Theatres');

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_pattern_transaction.id,
    unixepoch(datetime('now','localtime')) - overlay_pattern_transaction.weeks_ago * 7 * 86400,
    unixepoch(datetime('now','localtime')) - overlay_pattern_transaction.weeks_ago * 7 * 86400,
    'EXPENSE',
    overlay_pattern_transaction.title,
    unixepoch(datetime('now','localtime')) - overlay_pattern_transaction.weeks_ago * 7 * 86400,
    '',
    1,
    NULL,
    1.0,
    0
FROM overlay_pattern_transaction;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_pattern_transaction.id * 10,
    unixepoch(datetime('now','localtime')) - overlay_pattern_transaction.weeks_ago * 7 * 86400,
    unixepoch(datetime('now','localtime')) - overlay_pattern_transaction.weeks_ago * 7 * 86400,
    'CREDIT',
    1,
    overlay_pattern_transaction.category_id,
    overlay_pattern_transaction.id,
    overlay_pattern_transaction.amount,
    1.0,
    'USER',
    'PRIMARY'
FROM overlay_pattern_transaction;

-- Each repeated "Trader Joe's" occurrence carries a different tag, so the
-- Groceries pattern (grouped by category + title) aggregates 3 distinct
-- suggested tags once that category is picked.
INSERT INTO transaction_tags (transaction_id, tag_id, is_primary) VALUES
    (1800, 1, 1),
    (1801, 2, 1),
    (1802, 4, 1);

DROP TABLE overlay_pattern_transaction;
