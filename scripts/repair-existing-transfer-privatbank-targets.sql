PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

DROP TABLE IF EXISTS temp.existing_transfer_privatbank_target_repair_candidates;

CREATE TEMP TABLE existing_transfer_privatbank_target_repair_candidates (
    transfer_transaction_id INTEGER NOT NULL PRIMARY KEY,
    old_target_source_transaction_id INTEGER NOT NULL,
    new_target_source_transaction_id INTEGER NOT NULL,
    moved_target_entry_id INTEGER NOT NULL,
    new_target_source_entry_id INTEGER NOT NULL,
    old_target_account_id INTEGER NOT NULL,
    new_target_account_id INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    delta_seconds INTEGER NOT NULL
);

WITH existing_transfers AS (
    SELECT
        transfer.id AS transfer_transaction_id,
        transfer.operated_at AS transfer_operated_at,
        transfer.to_account_id AS old_target_account_id,
        live_target.amount
    FROM transactions transfer
    INNER JOIN transaction_entries live_target ON
        live_target.transaction_id = transfer.id
        AND live_target.deleted_at IS NULL
        AND live_target.original_transaction_id IS NULL
        AND live_target.type = 'DEBIT'
        AND live_target.account_id = transfer.to_account_id
    WHERE transfer.deleted_at IS NULL
        AND transfer.consolidation_parent_transaction_id IS NULL
        AND transfer.type = 'TRANSFER'
        AND transfer.consolidation_type = 'TRANSFER_PAIR'
        AND transfer.from_account_id IS NOT NULL
        AND transfer.to_account_id IS NOT NULL
), moved_targets AS (
    SELECT
        moved.transaction_id AS transfer_transaction_id,
        moved.id AS moved_target_entry_id,
        moved.original_transaction_id AS old_target_source_transaction_id,
        moved.account_id AS old_target_account_id,
        moved.amount
    FROM transaction_entries moved
    INNER JOIN transactions source ON
        source.id = moved.original_transaction_id
        AND source.deleted_at IS NULL
        AND source.consolidation_parent_transaction_id = moved.transaction_id
        AND source.type = 'INCOME'
    WHERE moved.deleted_at IS NULL
        AND moved.original_transaction_id IS NOT NULL
        AND moved.type = 'DEBIT'
), privatbank_income_sources AS (
    SELECT
        income.id AS new_target_source_transaction_id,
        income.operated_at AS income_operated_at,
        income_entry.id AS new_target_source_entry_id,
        income_entry.account_id AS new_target_account_id,
        income_entry.amount
    FROM transactions income
    INNER JOIN transaction_entries income_entry ON
        income_entry.transaction_id = income.id
        AND income_entry.deleted_at IS NULL
        AND income_entry.original_transaction_id IS NULL
        AND income_entry.type = 'DEBIT'
    INNER JOIN mcc_categories income_mcc ON
        income_mcc.id = income_entry.mcc_category_id
        AND income_mcc.mcc_group_id = 10
    WHERE income.deleted_at IS NULL
        AND income.consolidation_parent_transaction_id IS NULL
        AND income.type = 'INCOME'
        AND income.external_source = 'PRIVATBANK'
), ranked_candidates AS (
    SELECT
        transfer.transfer_transaction_id,
        moved.old_target_source_transaction_id,
        income.new_target_source_transaction_id,
        moved.moved_target_entry_id,
        income.new_target_source_entry_id,
        transfer.old_target_account_id,
        income.new_target_account_id,
        transfer.amount,
        income.income_operated_at - transfer.transfer_operated_at AS delta_seconds,
        ROW_NUMBER() OVER (
            PARTITION BY transfer.transfer_transaction_id
            ORDER BY ABS(income.income_operated_at - transfer.transfer_operated_at), income.new_target_source_transaction_id
        ) AS transfer_rank,
        ROW_NUMBER() OVER (
            PARTITION BY income.new_target_source_transaction_id
            ORDER BY ABS(income.income_operated_at - transfer.transfer_operated_at), transfer.transfer_transaction_id
        ) AS income_rank
    FROM existing_transfers transfer
    INNER JOIN moved_targets moved ON
        moved.transfer_transaction_id = transfer.transfer_transaction_id
        AND moved.old_target_account_id = transfer.old_target_account_id
        AND moved.amount = transfer.amount
    INNER JOIN privatbank_income_sources income ON
        income.amount = transfer.amount
        AND income.new_target_account_id != transfer.old_target_account_id
        AND ABS(income.income_operated_at - transfer.transfer_operated_at) <= 7210
)
INSERT INTO existing_transfer_privatbank_target_repair_candidates (
    transfer_transaction_id,
    old_target_source_transaction_id,
    new_target_source_transaction_id,
    moved_target_entry_id,
    new_target_source_entry_id,
    old_target_account_id,
    new_target_account_id,
    amount,
    delta_seconds
)
SELECT
    transfer_transaction_id,
    old_target_source_transaction_id,
    new_target_source_transaction_id,
    moved_target_entry_id,
    new_target_source_entry_id,
    old_target_account_id,
    new_target_account_id,
    amount,
    delta_seconds
FROM ranked_candidates
WHERE transfer_rank = 1
    AND income_rank = 1;

SELECT
    'candidate_count' AS repair_step,
    COUNT(*) AS existing_transfer_targets_to_repair
FROM existing_transfer_privatbank_target_repair_candidates;

SELECT
    candidate.transfer_transaction_id,
    candidate.old_target_source_transaction_id,
    candidate.new_target_source_transaction_id,
    old_target_account.title AS old_target_account_title,
    new_target_account.title AS new_target_account_title,
    candidate.amount,
    datetime(transfer.operated_at, 'unixepoch') AS transfer_operated_at,
    datetime(new_target_source.operated_at, 'unixepoch') AS new_target_source_operated_at,
    candidate.delta_seconds
FROM existing_transfer_privatbank_target_repair_candidates candidate
INNER JOIN transactions transfer ON transfer.id = candidate.transfer_transaction_id
INNER JOIN transactions new_target_source ON new_target_source.id = candidate.new_target_source_transaction_id
INNER JOIN accounts old_target_account ON old_target_account.id = candidate.old_target_account_id
INNER JOIN accounts new_target_account ON new_target_account.id = candidate.new_target_account_id
ORDER BY transfer.operated_at, candidate.transfer_transaction_id;

INSERT INTO transaction_entries (
    created_at,
    updated_at,
    deleted_at,
    type,
    account_id,
    category_id,
    transaction_id,
    amount,
    external_id,
    mcc_category_id,
    exchange_rate,
    to_iban,
    original_transaction_id,
    category_source
)
SELECT
    moved.created_at,
    unixepoch(),
    NULL,
    moved.type,
    moved.account_id,
    moved.category_id,
    candidate.old_target_source_transaction_id,
    moved.amount,
    moved.external_id,
    moved.mcc_category_id,
    moved.exchange_rate,
    moved.to_iban,
    NULL,
    moved.category_source
FROM existing_transfer_privatbank_target_repair_candidates candidate
INNER JOIN transaction_entries moved ON moved.id = candidate.moved_target_entry_id
WHERE NOT EXISTS (
    SELECT 1
    FROM transaction_entries existing_entry
    WHERE existing_entry.transaction_id = candidate.old_target_source_transaction_id
        AND existing_entry.deleted_at IS NULL
        AND existing_entry.original_transaction_id IS NULL
);

UPDATE transactions
SET
    to_account_id = (
        SELECT candidate.new_target_account_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        WHERE candidate.transfer_transaction_id = transactions.id
    ),
    updated_at = unixepoch()
WHERE id IN (
    SELECT transfer_transaction_id
    FROM existing_transfer_privatbank_target_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

UPDATE transaction_entries
SET
    account_id = (
        SELECT candidate.new_target_account_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        WHERE candidate.transfer_transaction_id = transaction_entries.transaction_id
    ),
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT transfer_transaction_id
    FROM existing_transfer_privatbank_target_repair_candidates
)
    AND type = 'DEBIT'
    AND original_transaction_id IS NULL
    AND deleted_at IS NULL;

UPDATE transaction_entries
SET
    account_id = (
        SELECT new_target_entry.account_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        INNER JOIN transaction_entries new_target_entry ON new_target_entry.id = candidate.new_target_source_entry_id
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    category_id = (
        SELECT new_target_entry.category_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        INNER JOIN transaction_entries new_target_entry ON new_target_entry.id = candidate.new_target_source_entry_id
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    amount = (
        SELECT new_target_entry.amount
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        INNER JOIN transaction_entries new_target_entry ON new_target_entry.id = candidate.new_target_source_entry_id
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    external_id = (
        SELECT new_target_entry.external_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        INNER JOIN transaction_entries new_target_entry ON new_target_entry.id = candidate.new_target_source_entry_id
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    mcc_category_id = (
        SELECT new_target_entry.mcc_category_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        INNER JOIN transaction_entries new_target_entry ON new_target_entry.id = candidate.new_target_source_entry_id
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    exchange_rate = (
        SELECT new_target_entry.exchange_rate
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        INNER JOIN transaction_entries new_target_entry ON new_target_entry.id = candidate.new_target_source_entry_id
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    to_iban = (
        SELECT new_target_entry.to_iban
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        INNER JOIN transaction_entries new_target_entry ON new_target_entry.id = candidate.new_target_source_entry_id
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    original_transaction_id = (
        SELECT candidate.new_target_source_transaction_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        WHERE candidate.moved_target_entry_id = transaction_entries.id
    ),
    updated_at = unixepoch()
WHERE id IN (
    SELECT moved_target_entry_id
    FROM existing_transfer_privatbank_target_repair_candidates
)
    AND deleted_at IS NULL;

UPDATE transactions
SET
    consolidation_parent_transaction_id = NULL,
    updated_at = unixepoch()
WHERE id IN (
    SELECT old_target_source_transaction_id
    FROM existing_transfer_privatbank_target_repair_candidates
)
    AND deleted_at IS NULL;

UPDATE transactions
SET
    consolidation_parent_transaction_id = (
        SELECT candidate.transfer_transaction_id
        FROM existing_transfer_privatbank_target_repair_candidates candidate
        WHERE candidate.new_target_source_transaction_id = transactions.id
    ),
    updated_at = unixepoch()
WHERE id IN (
    SELECT new_target_source_transaction_id
    FROM existing_transfer_privatbank_target_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

SELECT
    'restored_old_target_sources' AS repair_step,
    COUNT(*) AS restored_old_target_sources
FROM transactions source
INNER JOIN existing_transfer_privatbank_target_repair_candidates candidate ON
    candidate.old_target_source_transaction_id = source.id
WHERE source.consolidation_parent_transaction_id IS NULL;

SELECT
    'repaired_existing_transfer_targets' AS repair_step,
    COUNT(*) AS repaired_existing_transfer_targets
FROM transactions transfer
INNER JOIN existing_transfer_privatbank_target_repair_candidates candidate ON
    candidate.transfer_transaction_id = transfer.id
    AND candidate.new_target_account_id = transfer.to_account_id;

SELECT
    'moved_privatbank_sources' AS repair_step,
    COUNT(*) AS moved_privatbank_sources
FROM transaction_entries moved
INNER JOIN existing_transfer_privatbank_target_repair_candidates candidate ON
    candidate.moved_target_entry_id = moved.id
    AND candidate.new_target_source_transaction_id = moved.original_transaction_id
    AND candidate.new_target_account_id = moved.account_id;

DROP TABLE IF EXISTS temp.existing_transfer_privatbank_target_repair_candidates;

COMMIT;
