-- Clears the category on the newest expenses so the missing-category pill has a real count.

UPDATE transaction_entries
SET
    category_id = NULL,
    updated_at = unixepoch('now')
WHERE transaction_id IN (
    SELECT transactions.id
    FROM transactions
    WHERE transactions.id BETWEEN 101 AND 199
      AND transactions.type = 'EXPENSE'
      AND transactions.deleted_at IS NULL
    ORDER BY transactions.operated_at DESC
    LIMIT 14
);
