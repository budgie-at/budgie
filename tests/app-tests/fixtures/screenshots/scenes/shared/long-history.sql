-- Replays the newest base transactions monthly across the previous 17 months for trend data.

DELETE FROM transaction_tags WHERE transaction_id BETWEEN 3000 AND 6999;
DELETE FROM transaction_entries WHERE transaction_id BETWEEN 3000 AND 6999;
DELETE FROM transactions WHERE id BETWEEN 3000 AND 6999;

CREATE TEMP TABLE overlay_source AS
SELECT
    transactions.id AS source_id,
    transactions.type AS type,
    transactions.title AS title,
    transactions.from_account_id AS from_account_id,
    transactions.to_account_id AS to_account_id,
    transactions.operated_at AS operated_at,
    ROW_NUMBER() OVER (ORDER BY transactions.operated_at DESC, transactions.id DESC) AS seq
FROM transactions
WHERE transactions.id BETWEEN 101 AND 303
  AND transactions.type IN ('EXPENSE', 'INCOME')
  AND transactions.deleted_at IS NULL;

DELETE FROM overlay_source WHERE seq > 40;

CREATE TEMP TABLE overlay_clone AS
WITH RECURSIVE month_offset(months_ago) AS (
    SELECT 1
    UNION ALL
    SELECT months_ago + 1 FROM month_offset WHERE months_ago < 17
)
SELECT
    3000 + month_offset.months_ago * 200 + overlay_source.seq AS id,
    overlay_source.source_id AS source_id,
    month_offset.months_ago AS months_ago,
    unixepoch(datetime(
        date(overlay_source.operated_at, 'unixepoch', '-' || month_offset.months_ago || ' months'),
        strftime('%H:%M:%S', overlay_source.operated_at, 'unixepoch')
    )) AS operated_at
FROM overlay_source
CROSS JOIN month_offset;

INSERT INTO transactions (id, created_at, updated_at, type, title, operated_at, comment, from_account_id, to_account_id, exchange_rate, needs_embedding)
SELECT
    overlay_clone.id,
    overlay_clone.operated_at,
    overlay_clone.operated_at,
    overlay_source.type,
    overlay_source.title,
    overlay_clone.operated_at,
    '',
    overlay_source.from_account_id,
    overlay_source.to_account_id,
    1.0,
    0
FROM overlay_clone
INNER JOIN overlay_source ON overlay_source.source_id = overlay_clone.source_id;

INSERT INTO transaction_entries (id, created_at, updated_at, type, account_id, category_id, transaction_id, amount, exchange_rate, category_source, kind)
SELECT
    overlay_clone.id * 10,
    overlay_clone.operated_at,
    overlay_clone.operated_at,
    transaction_entries.type,
    transaction_entries.account_id,
    transaction_entries.category_id,
    overlay_clone.id,
    CAST(transaction_entries.amount * (1.0 + ((overlay_clone.months_ago * 7 + overlay_clone.id) % 25 - 12) / 100.0) AS INTEGER),
    1.0,
    transaction_entries.category_source,
    'PRIMARY'
FROM overlay_clone
INNER JOIN transaction_entries
    ON transaction_entries.transaction_id = overlay_clone.source_id
   AND transaction_entries.deleted_at IS NULL;

DROP TABLE overlay_clone;
DROP TABLE overlay_source;
