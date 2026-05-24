BEGIN;

DROP TABLE IF EXISTS temp.privatbank_duplicate_repair_candidates;

CREATE TEMP TABLE privatbank_duplicate_repair_candidates AS
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
), visible_pairs AS (
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
        'visible_duplicate' AS reason
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
        'hidden_source_duplicate' AS reason
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
)
SELECT DISTINCT
    duplicate_transaction_id,
    kept_transaction_id,
    reason
FROM visible_pairs
UNION
SELECT DISTINCT
    duplicate_transaction_id,
    kept_transaction_id,
    reason
FROM hidden_source_pairs;

SELECT
    COUNT(*) AS duplicate_transactions_to_soft_delete
FROM privatbank_duplicate_repair_candidates;

SELECT
    candidate.reason,
    candidate.kept_transaction_id,
    candidate.duplicate_transaction_id,
    kept.title,
    datetime(kept.operated_at, 'unixepoch') AS kept_operated_at,
    datetime(duplicate.operated_at, 'unixepoch') AS duplicate_operated_at,
    duplicate.operated_at - kept.operated_at AS delta_seconds
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

UPDATE transaction_entries
SET
    deleted_at = unixepoch(),
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT duplicate_transaction_id
    FROM privatbank_duplicate_repair_candidates
)
    AND deleted_at IS NULL;

DROP TABLE IF EXISTS temp.privatbank_duplicate_repair_candidates;

COMMIT;
