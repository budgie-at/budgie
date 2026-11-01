.read shared/long-history.sql

UPDATE transactions
SET operated_at = unixepoch(date('now', 'start of month')) + operated_at % 86400
WHERE id BETWEEN 101 AND 303
  AND type = 'EXPENSE'
  AND deleted_at IS NULL
  AND operated_at >= unixepoch(date('now', '-2 days'))
  AND operated_at < unixepoch(date('now', 'start of month'));
