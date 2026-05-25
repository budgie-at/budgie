PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

DROP TABLE IF EXISTS temp.erste_duplicate_repair_candidates;

CREATE TEMP TABLE erste_duplicate_repair_candidates (
    duplicate_transaction_id INTEGER NOT NULL PRIMARY KEY,
    kept_transaction_id INTEGER NOT NULL,
    reason TEXT NOT NULL
);

WITH erste_rows AS (
    SELECT
        tx.id AS transaction_id,
        tx.created_at,
        tx.operated_at,
        date(tx.operated_at, 'unixepoch') AS operated_day,
        tx.type AS transaction_type,
        tx.title,
        tx.comment,
        entry.account_id,
        entry.type AS entry_type,
        entry.amount
    FROM transactions tx
    INNER JOIN transaction_entries entry ON
        entry.transaction_id = tx.id
        AND entry.deleted_at IS NULL
        AND entry.original_transaction_id IS NULL
    WHERE tx.external_source = 'ERSTE'
        AND tx.deleted_at IS NULL
        AND tx.consolidation_parent_transaction_id IS NULL
), semantic_pairs AS (
    SELECT
        CASE
            WHEN newer.created_at > older.created_at THEN newer.transaction_id
            WHEN newer.created_at < older.created_at THEN older.transaction_id
            ELSE MAX(newer.transaction_id, older.transaction_id)
        END AS duplicate_transaction_id,
        CASE
            WHEN newer.created_at > older.created_at THEN older.transaction_id
            WHEN newer.created_at < older.created_at THEN newer.transaction_id
            ELSE MIN(newer.transaction_id, older.transaction_id)
        END AS kept_transaction_id,
        'semantic_duplicate' AS reason
    FROM erste_rows older
    INNER JOIN erste_rows newer ON
        newer.transaction_id > older.transaction_id
        AND newer.account_id = older.account_id
        AND newer.transaction_type = older.transaction_type
        AND newer.entry_type = older.entry_type
        AND newer.operated_day = older.operated_day
        AND newer.amount = older.amount
        AND newer.title = older.title
        AND newer.comment = older.comment
), ranked_candidates AS (
    SELECT
        duplicate_transaction_id,
        kept_transaction_id,
        reason,
        ROW_NUMBER() OVER (
            PARTITION BY duplicate_transaction_id
            ORDER BY kept_transaction_id
        ) AS candidate_rank
    FROM semantic_pairs
)
INSERT INTO erste_duplicate_repair_candidates (
    duplicate_transaction_id,
    kept_transaction_id,
    reason
)
SELECT
    duplicate_transaction_id,
    kept_transaction_id,
    reason
FROM ranked_candidates
WHERE candidate_rank = 1;

SELECT
    'candidate_count' AS repair_step,
    COUNT(*) AS duplicate_transactions_to_soft_delete
FROM erste_duplicate_repair_candidates;

SELECT
    candidate.reason,
    candidate.kept_transaction_id,
    candidate.duplicate_transaction_id,
    kept.title,
    kept.external_id AS kept_external_id,
    duplicate.external_id AS duplicate_external_id,
    round(kept_entry.amount / 1000000.0, 2) AS amount,
    datetime(kept.operated_at, 'unixepoch') AS kept_operated_at,
    datetime(duplicate.operated_at, 'unixepoch') AS duplicate_operated_at
FROM erste_duplicate_repair_candidates candidate
INNER JOIN transactions kept ON
    kept.id = candidate.kept_transaction_id
INNER JOIN transactions duplicate ON
    duplicate.id = candidate.duplicate_transaction_id
INNER JOIN transaction_entries kept_entry ON
    kept_entry.transaction_id = kept.id
    AND kept_entry.deleted_at IS NULL
    AND kept_entry.original_transaction_id IS NULL
ORDER BY duplicate.operated_at, candidate.duplicate_transaction_id;

UPDATE transactions
SET
    deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE id IN (
    SELECT duplicate_transaction_id
    FROM erste_duplicate_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

SELECT
    'transactions_soft_deleted' AS repair_step,
    COUNT(*) AS duplicate_transactions_soft_deleted
FROM transactions
WHERE id IN (
    SELECT duplicate_transaction_id
    FROM erste_duplicate_repair_candidates
)
    AND deleted_at IS NOT NULL;

UPDATE transaction_entries
SET
    deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT duplicate_transaction_id
    FROM erste_duplicate_repair_candidates
)
    AND deleted_at IS NULL;

SELECT
    'entries_soft_deleted' AS repair_step,
    COUNT(*) AS duplicate_entries_soft_deleted
FROM transaction_entries
WHERE transaction_id IN (
    SELECT duplicate_transaction_id
    FROM erste_duplicate_repair_candidates
)
    AND deleted_at IS NOT NULL;

DROP TABLE IF EXISTS temp.erste_duplicate_repair_candidates;

COMMIT;
