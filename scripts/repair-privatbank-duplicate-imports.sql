PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

DROP TABLE IF EXISTS temp.privatbank_duplicate_repair_candidates;

CREATE TEMP TABLE privatbank_duplicate_repair_candidates (
    duplicate_transaction_id INTEGER NOT NULL PRIMARY KEY,
    kept_transaction_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    delta_seconds INTEGER NOT NULL
);

WITH privatbank_rows AS (
    SELECT
        tx.id AS transaction_id,
        tx.created_at,
        tx.operated_at,
        date(tx.operated_at, 'unixepoch') AS operated_day,
        tx.type AS transaction_type,
        tx.title,
        entry.account_id,
        entry.type AS entry_type,
        entry.amount,
        COALESCE(entry.mcc_category_id, -1) AS mcc_category_id
    FROM transactions tx
    INNER JOIN transaction_entries entry ON
        entry.transaction_id = tx.id
        AND entry.deleted_at IS NULL
        AND entry.original_transaction_id IS NULL
    WHERE tx.external_source = 'PRIVATBANK'
        AND tx.deleted_at IS NULL
        AND tx.consolidation_parent_transaction_id IS NULL
), visible_candidate_pairs AS (
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
        'visible_duplicate' AS reason,
        newer.operated_at - older.operated_at AS delta_seconds,
        2 AS reason_priority
    FROM privatbank_rows older
    INNER JOIN privatbank_rows newer ON
        newer.transaction_id > older.transaction_id
        AND newer.account_id = older.account_id
        AND newer.transaction_type = older.transaction_type
        AND newer.entry_type = older.entry_type
        AND newer.title = older.title
        AND newer.amount = older.amount
        AND newer.mcc_category_id = older.mcc_category_id
        AND newer.operated_day = older.operated_day
        AND ABS(newer.operated_at - older.operated_at) BETWEEN 3590 AND 3610
), hidden_sources AS (
    SELECT
        source.id AS transaction_id,
        source.operated_at,
        date(source.operated_at, 'unixepoch') AS operated_day,
        source.type AS transaction_type,
        source.title,
        moved.account_id,
        moved.type AS entry_type,
        moved.amount,
        COALESCE(moved.mcc_category_id, -1) AS mcc_category_id
    FROM transactions source
    INNER JOIN transaction_entries moved ON
        moved.original_transaction_id = source.id
        AND moved.deleted_at IS NULL
    WHERE source.external_source = 'PRIVATBANK'
        AND source.deleted_at IS NULL
        AND source.consolidation_parent_transaction_id IS NOT NULL
), hidden_source_pairs AS (
    SELECT
        visible.transaction_id AS duplicate_transaction_id,
        hidden.transaction_id AS kept_transaction_id,
        'hidden_source_duplicate' AS reason,
        visible.operated_at - hidden.operated_at AS delta_seconds,
        1 AS reason_priority
    FROM hidden_sources hidden
    INNER JOIN privatbank_rows visible ON
        visible.account_id = hidden.account_id
        AND visible.transaction_type = hidden.transaction_type
        AND visible.entry_type = hidden.entry_type
        AND visible.title = hidden.title
        AND visible.amount = hidden.amount
        AND visible.mcc_category_id = hidden.mcc_category_id
        AND visible.operated_day = hidden.operated_day
        AND ABS(visible.operated_at - hidden.operated_at) BETWEEN 3590 AND 3610
), ranked_candidates AS (
    SELECT
        duplicate_transaction_id,
        kept_transaction_id,
        reason,
        delta_seconds,
        ROW_NUMBER() OVER (
            PARTITION BY duplicate_transaction_id
            ORDER BY reason_priority, ABS(delta_seconds), kept_transaction_id
        ) AS candidate_rank
    FROM (
        SELECT
            duplicate_transaction_id,
            kept_transaction_id,
            reason,
            delta_seconds,
            reason_priority
        FROM visible_candidate_pairs
        UNION ALL
        SELECT
            duplicate_transaction_id,
            kept_transaction_id,
            reason,
            delta_seconds,
            reason_priority
        FROM hidden_source_pairs
    )
)
INSERT INTO privatbank_duplicate_repair_candidates (
    duplicate_transaction_id,
    kept_transaction_id,
    reason,
    delta_seconds
)
SELECT
    duplicate_transaction_id,
    kept_transaction_id,
    reason,
    delta_seconds
FROM ranked_candidates
WHERE candidate_rank = 1;

SELECT
    'candidate_count' AS repair_step,
    COUNT(*) AS duplicate_transactions_to_soft_delete
FROM privatbank_duplicate_repair_candidates;

SELECT
    candidate.reason,
    candidate.kept_transaction_id,
    candidate.duplicate_transaction_id,
    kept.title,
    duplicate.external_id AS duplicate_external_id,
    datetime(kept.created_at, 'unixepoch') AS kept_created_at,
    datetime(duplicate.created_at, 'unixepoch') AS duplicate_created_at,
    datetime(kept.operated_at, 'unixepoch') AS kept_operated_at,
    datetime(duplicate.operated_at, 'unixepoch') AS duplicate_operated_at,
    candidate.delta_seconds
FROM privatbank_duplicate_repair_candidates candidate
INNER JOIN transactions kept ON kept.id = candidate.kept_transaction_id
INNER JOIN transactions duplicate ON duplicate.id = candidate.duplicate_transaction_id
ORDER BY duplicate.operated_at DESC, candidate.duplicate_transaction_id;

UPDATE transactions
SET
    deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE id IN (
    SELECT duplicate_transaction_id
    FROM privatbank_duplicate_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

SELECT
    'transactions_soft_deleted' AS repair_step,
    COUNT(*) AS duplicate_transactions_soft_deleted
FROM transactions
WHERE id IN (
    SELECT duplicate_transaction_id
    FROM privatbank_duplicate_repair_candidates
)
    AND deleted_at IS NOT NULL;

UPDATE transaction_entries
SET
    deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT duplicate_transaction_id
    FROM privatbank_duplicate_repair_candidates
)
    AND deleted_at IS NULL;

SELECT
    'entries_soft_deleted' AS repair_step,
    COUNT(*) AS duplicate_entries_soft_deleted
FROM transaction_entries
WHERE transaction_id IN (
    SELECT duplicate_transaction_id
    FROM privatbank_duplicate_repair_candidates
)
    AND deleted_at IS NOT NULL;

DROP TABLE IF EXISTS temp.privatbank_duplicate_repair_candidates;

COMMIT;
