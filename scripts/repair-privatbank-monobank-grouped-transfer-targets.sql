PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

DROP TABLE IF EXISTS temp.privatbank_monobank_grouped_transfer_repair_candidates;

CREATE TEMP TABLE privatbank_monobank_grouped_transfer_repair_candidates (
    transfer_transaction_id INTEGER NOT NULL,
    monobank_income_transaction_id INTEGER NOT NULL,
    old_target_account_id INTEGER NOT NULL,
    new_target_account_id INTEGER NOT NULL,
    source_amount INTEGER NOT NULL,
    income_amount INTEGER NOT NULL,
    income_count INTEGER NOT NULL,
    nearest_delta_seconds INTEGER NOT NULL,
    PRIMARY KEY (transfer_transaction_id, monobank_income_transaction_id)
);

WITH legacy_transfers AS (
    SELECT
        transfer.id AS transfer_transaction_id,
        transfer.operated_at AS transfer_operated_at,
        transfer.to_account_id AS old_target_account_id,
        source_entry.amount AS source_amount,
        target_account.instrument_id AS target_instrument_id
    FROM transactions transfer
    INNER JOIN transaction_entries source_entry ON
        source_entry.transaction_id = transfer.id
        AND source_entry.deleted_at IS NULL
        AND source_entry.original_transaction_id IS NULL
        AND source_entry.account_id = transfer.from_account_id
    INNER JOIN accounts source_account ON
        source_account.id = source_entry.account_id
        AND source_account.title LIKE '%приватбанк%'
    INNER JOIN accounts target_account ON
        target_account.id = transfer.to_account_id
        AND target_account.deleted_at IS NOT NULL
        AND target_account.title LIKE '%monobank%'
    WHERE transfer.deleted_at IS NULL
        AND transfer.consolidation_parent_transaction_id IS NULL
        AND transfer.type = 'TRANSFER'
        AND transfer.external_source = 'CSV'
        AND source_entry.amount > 0
), monobank_income_rows AS (
    SELECT
        transfer.transfer_transaction_id,
        transfer.old_target_account_id,
        transfer.source_amount,
        income.id AS monobank_income_transaction_id,
        income.operated_at AS income_operated_at,
        income_entry.account_id AS new_target_account_id,
        income_entry.amount AS income_amount
    FROM legacy_transfers transfer
    INNER JOIN transactions income ON
        income.deleted_at IS NULL
        AND income.consolidation_parent_transaction_id IS NULL
        AND income.type = 'INCOME'
        AND income.external_source = 'MONOBANK'
        AND income.operated_at BETWEEN transfer.transfer_operated_at - 86400
            AND transfer.transfer_operated_at + 86400
    INNER JOIN transaction_entries income_entry ON
        income_entry.transaction_id = income.id
        AND income_entry.deleted_at IS NULL
        AND income_entry.original_transaction_id IS NULL
        AND income_entry.type = 'DEBIT'
        AND income_entry.amount > 0
    INNER JOIN accounts income_account ON
        income_account.id = income_entry.account_id
        AND income_account.deleted_at IS NULL
        AND income_account.instrument_id = transfer.target_instrument_id
    INNER JOIN mcc_categories income_mcc ON
        income_mcc.id = income_entry.mcc_category_id
        AND income_mcc.mcc_group_id = 10
), matching_groups AS (
    SELECT
        transfer_transaction_id,
        old_target_account_id,
        new_target_account_id,
        source_amount,
        SUM(income_amount) AS income_sum,
        COUNT(*) AS income_count,
        MIN(ABS(income_operated_at - (
            SELECT operated_at
            FROM transactions transfer
            WHERE transfer.id = monobank_income_rows.transfer_transaction_id
        ))) AS nearest_delta_seconds
    FROM monobank_income_rows
    GROUP BY
        transfer_transaction_id,
        old_target_account_id,
        new_target_account_id,
        source_amount
    HAVING income_sum = source_amount
), unambiguous_groups AS (
    SELECT matching_groups.*
    FROM matching_groups
    WHERE NOT EXISTS (
        SELECT 1
        FROM matching_groups competing_group
        WHERE competing_group.transfer_transaction_id = matching_groups.transfer_transaction_id
            AND competing_group.new_target_account_id != matching_groups.new_target_account_id
    )
)
INSERT INTO privatbank_monobank_grouped_transfer_repair_candidates (
    transfer_transaction_id,
    monobank_income_transaction_id,
    old_target_account_id,
    new_target_account_id,
    source_amount,
    income_amount,
    income_count,
    nearest_delta_seconds
)
SELECT
    income.transfer_transaction_id,
    income.monobank_income_transaction_id,
    income.old_target_account_id,
    income.new_target_account_id,
    income.source_amount,
    income.income_amount,
    groups.income_count,
    groups.nearest_delta_seconds
FROM monobank_income_rows income
INNER JOIN unambiguous_groups groups ON
    groups.transfer_transaction_id = income.transfer_transaction_id
    AND groups.new_target_account_id = income.new_target_account_id;

SELECT
    'candidate_transfer_count' AS repair_step,
    COUNT(DISTINCT transfer_transaction_id) AS transfer_targets_to_repair
FROM privatbank_monobank_grouped_transfer_repair_candidates;

SELECT
    'candidate_income_count' AS repair_step,
    COUNT(*) AS monobank_income_sources_to_move
FROM privatbank_monobank_grouped_transfer_repair_candidates;

SELECT
    candidate.transfer_transaction_id,
    GROUP_CONCAT(candidate.monobank_income_transaction_id, ',') AS monobank_income_transaction_ids,
    old_target_account.title AS old_target_account_title,
    new_target_account.title AS new_target_account_title,
    candidate.source_amount,
    SUM(candidate.income_amount) AS income_sum,
    MAX(candidate.income_count) AS income_count,
    MAX(candidate.nearest_delta_seconds) AS nearest_delta_seconds
FROM privatbank_monobank_grouped_transfer_repair_candidates candidate
INNER JOIN accounts old_target_account ON old_target_account.id = candidate.old_target_account_id
INNER JOIN accounts new_target_account ON new_target_account.id = candidate.new_target_account_id
GROUP BY
    candidate.transfer_transaction_id,
    old_target_account.title,
    new_target_account.title,
    candidate.source_amount
ORDER BY candidate.transfer_transaction_id;

INSERT INTO transaction_entries (
    type,
    account_id,
    transaction_id,
    amount,
    exchange_rate
)
SELECT
    'DEBIT',
    candidate.new_target_account_id,
    candidate.transfer_transaction_id,
    candidate.source_amount,
    1
FROM privatbank_monobank_grouped_transfer_repair_candidates candidate
WHERE NOT EXISTS (
    SELECT 1
    FROM transaction_entries target_entry
    WHERE target_entry.transaction_id = candidate.transfer_transaction_id
        AND target_entry.deleted_at IS NULL
        AND target_entry.original_transaction_id IS NULL
        AND target_entry.type = 'DEBIT'
        AND target_entry.account_id = candidate.new_target_account_id
)
GROUP BY
    candidate.transfer_transaction_id,
    candidate.new_target_account_id,
    candidate.source_amount;

UPDATE transactions
SET
    to_account_id = (
        SELECT candidate.new_target_account_id
        FROM privatbank_monobank_grouped_transfer_repair_candidates candidate
        WHERE candidate.transfer_transaction_id = transactions.id
        LIMIT 1
    ),
    exchange_rate = 1,
    consolidation_type = 'TRANSFER_PAIR',
    updated_at = unixepoch()
WHERE id IN (
    SELECT transfer_transaction_id
    FROM privatbank_monobank_grouped_transfer_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

UPDATE transaction_entries
SET
    original_transaction_id = transaction_id,
    transaction_id = (
        SELECT candidate.transfer_transaction_id
        FROM privatbank_monobank_grouped_transfer_repair_candidates candidate
        WHERE candidate.monobank_income_transaction_id = transaction_entries.transaction_id
        LIMIT 1
    ),
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT monobank_income_transaction_id
    FROM privatbank_monobank_grouped_transfer_repair_candidates
)
    AND deleted_at IS NULL
    AND original_transaction_id IS NULL;

UPDATE transactions
SET
    consolidation_parent_transaction_id = (
        SELECT candidate.transfer_transaction_id
        FROM privatbank_monobank_grouped_transfer_repair_candidates candidate
        WHERE candidate.monobank_income_transaction_id = transactions.id
        LIMIT 1
    ),
    updated_at = unixepoch()
WHERE id IN (
    SELECT monobank_income_transaction_id
    FROM privatbank_monobank_grouped_transfer_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

SELECT
    'transfer_targets_repaired' AS repair_step,
    COUNT(DISTINCT transfer.id) AS repaired_transfer_targets
FROM transactions transfer
INNER JOIN privatbank_monobank_grouped_transfer_repair_candidates candidate ON
    candidate.transfer_transaction_id = transfer.id
    AND transfer.to_account_id = candidate.new_target_account_id
WHERE transfer.consolidation_type = 'TRANSFER_PAIR';

SELECT
    'income_sources_moved' AS repair_step,
    COUNT(*) AS moved_income_sources
FROM transactions income
INNER JOIN privatbank_monobank_grouped_transfer_repair_candidates candidate ON
    candidate.monobank_income_transaction_id = income.id
    AND income.consolidation_parent_transaction_id = candidate.transfer_transaction_id;

DROP TABLE IF EXISTS temp.privatbank_monobank_grouped_transfer_repair_candidates;

COMMIT;
