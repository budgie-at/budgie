-- Moves the paired legs onto the canonical transfer, the shape consolidation leaves behind.

.read shared/transfer-pair.sql

UPDATE transaction_entries
SET transaction_id = 2110,
    original_transaction_id = 2111
WHERE id = 21110;

UPDATE transaction_entries
SET transaction_id = 2110,
    original_transaction_id = 2112
WHERE id = 21120;
