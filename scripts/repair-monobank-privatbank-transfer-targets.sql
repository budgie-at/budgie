PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

DROP TABLE IF EXISTS temp.monobank_privatbank_target_repair_candidates;

CREATE TEMP TABLE monobank_privatbank_target_repair_candidates (
    transfer_transaction_id INTEGER NOT NULL PRIMARY KEY,
    privatbank_income_transaction_id INTEGER NOT NULL,
    old_target_account_id INTEGER NOT NULL,
    new_target_account_id INTEGER NOT NULL,
    old_target_amount INTEGER NOT NULL,
    new_target_amount INTEGER NOT NULL,
    source_amount INTEGER NOT NULL,
    exchange_rate REAL NOT NULL,
    amount_delta INTEGER NOT NULL,
    delta_seconds INTEGER NOT NULL
);

WITH monobank_transfers AS (
    SELECT
        transfer.id AS transfer_transaction_id,
        transfer.operated_at AS transfer_operated_at,
        transfer.to_account_id AS old_target_account_id,
        source_entry.amount AS source_amount,
        target_entry.amount AS target_amount,
        transfer.exchange_rate,
        source_account.instrument_id AS source_instrument_id,
        old_target_account.instrument_id AS old_target_instrument_id
    FROM transactions transfer
    INNER JOIN transaction_entries source_entry ON
        source_entry.transaction_id = transfer.id
        AND source_entry.deleted_at IS NULL
        AND source_entry.original_transaction_id IS NULL
        AND source_entry.account_id = transfer.from_account_id
    INNER JOIN accounts source_account ON
        source_account.id = source_entry.account_id
        AND source_account.deleted_at IS NULL
    INNER JOIN transaction_entries target_entry ON
        target_entry.transaction_id = transfer.id
        AND target_entry.deleted_at IS NULL
        AND target_entry.original_transaction_id IS NULL
        AND target_entry.account_id = transfer.to_account_id
    INNER JOIN accounts old_target_account ON
        old_target_account.id = transfer.to_account_id
        AND old_target_account.external_source IS NULL
        AND old_target_account.iban IS NULL
        AND old_target_account.deleted_at IS NULL
    WHERE transfer.deleted_at IS NULL
        AND transfer.consolidation_parent_transaction_id IS NULL
        AND transfer.type = 'TRANSFER'
        AND transfer.external_source = 'MONOBANK'
        AND transfer.exchange_rate > 0
), privatbank_incomes AS (
    SELECT
        income.id AS privatbank_income_transaction_id,
        income.operated_at AS income_operated_at,
        income_entry.account_id AS new_target_account_id,
        income_entry.amount,
        privatbank_account.instrument_id AS new_target_instrument_id
    FROM transactions income
    INNER JOIN transaction_entries income_entry ON
        income_entry.transaction_id = income.id
        AND income_entry.deleted_at IS NULL
        AND income_entry.original_transaction_id IS NULL
        AND income_entry.type = 'DEBIT'
    INNER JOIN accounts privatbank_account ON
        privatbank_account.id = income_entry.account_id
        AND privatbank_account.deleted_at IS NULL
    WHERE income.deleted_at IS NULL
        AND income.consolidation_parent_transaction_id IS NULL
        AND income.type = 'INCOME'
        AND income.external_source = 'PRIVATBANK'
), ranked_candidates AS (
    SELECT
        transfer.transfer_transaction_id,
        income.privatbank_income_transaction_id,
        transfer.old_target_account_id,
        income.new_target_account_id,
        transfer.target_amount AS old_target_amount,
        income.amount AS new_target_amount,
        transfer.source_amount,
        transfer.source_amount * 1.0 / income.amount AS exchange_rate,
        ABS(income.amount - transfer.target_amount) AS amount_delta,
        income.income_operated_at - transfer.transfer_operated_at AS delta_seconds,
        ROW_NUMBER() OVER (
            PARTITION BY transfer.transfer_transaction_id
            ORDER BY
                ABS(income.amount - transfer.target_amount),
                ABS(income.income_operated_at - transfer.transfer_operated_at),
                income.privatbank_income_transaction_id
        ) AS transfer_rank,
        ROW_NUMBER() OVER (
            PARTITION BY income.privatbank_income_transaction_id
            ORDER BY
                ABS(income.amount - transfer.target_amount),
                ABS(income.income_operated_at - transfer.transfer_operated_at),
                transfer.transfer_transaction_id
        ) AS income_rank
    FROM monobank_transfers transfer
    INNER JOIN privatbank_incomes income ON
        income.new_target_account_id != transfer.old_target_account_id
        AND income.new_target_instrument_id = transfer.old_target_instrument_id
        AND income.amount > 0
        AND ABS(income.income_operated_at - transfer.transfer_operated_at) <= 7200
        AND (
            income.amount = transfer.target_amount
            OR (
                transfer.source_instrument_id != income.new_target_instrument_id
                AND ABS(income.amount - transfer.target_amount) <= 100000000
                AND ABS(income.amount - ROUND(transfer.source_amount / transfer.exchange_rate)) <= 100000000
                AND ABS(income.amount - transfer.target_amount) <= income.amount * 0.005
                AND ABS(income.amount - ROUND(transfer.source_amount / transfer.exchange_rate)) <= income.amount * 0.005
            )
        )
)
INSERT INTO monobank_privatbank_target_repair_candidates (
    transfer_transaction_id,
    privatbank_income_transaction_id,
    old_target_account_id,
    new_target_account_id,
    old_target_amount,
    new_target_amount,
    source_amount,
    exchange_rate,
    amount_delta,
    delta_seconds
)
SELECT
    transfer_transaction_id,
    privatbank_income_transaction_id,
    old_target_account_id,
    new_target_account_id,
    old_target_amount,
    new_target_amount,
    source_amount,
    exchange_rate,
    amount_delta,
    delta_seconds
FROM ranked_candidates
WHERE transfer_rank = 1
    AND income_rank = 1;

SELECT
    'candidate_count' AS repair_step,
    COUNT(*) AS transfer_targets_to_repair
FROM monobank_privatbank_target_repair_candidates;

SELECT
    candidate.transfer_transaction_id,
    candidate.privatbank_income_transaction_id,
    candidate.old_target_account_id,
    old_target_account.title AS old_target_account_title,
    candidate.new_target_account_id,
    new_target_account.title AS new_target_account_title,
    candidate.old_target_amount,
    candidate.new_target_amount,
    candidate.source_amount,
    candidate.exchange_rate,
    candidate.amount_delta,
    datetime(transfer.operated_at, 'unixepoch') AS transfer_operated_at,
    datetime(income.operated_at, 'unixepoch') AS income_operated_at,
    candidate.delta_seconds
FROM monobank_privatbank_target_repair_candidates candidate
INNER JOIN transactions transfer ON transfer.id = candidate.transfer_transaction_id
INNER JOIN transactions income ON income.id = candidate.privatbank_income_transaction_id
INNER JOIN accounts old_target_account ON old_target_account.id = candidate.old_target_account_id
INNER JOIN accounts new_target_account ON new_target_account.id = candidate.new_target_account_id
ORDER BY transfer.operated_at, candidate.transfer_transaction_id;

UPDATE transactions
SET
    to_account_id = (
        SELECT candidate.new_target_account_id
        FROM monobank_privatbank_target_repair_candidates candidate
        WHERE candidate.transfer_transaction_id = transactions.id
    ),
    exchange_rate = (
        SELECT candidate.exchange_rate
        FROM monobank_privatbank_target_repair_candidates candidate
        WHERE candidate.transfer_transaction_id = transactions.id
    ),
    consolidation_type = 'TRANSFER_PAIR',
    updated_at = unixepoch()
WHERE id IN (
    SELECT transfer_transaction_id
    FROM monobank_privatbank_target_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

UPDATE transaction_entries
SET
    account_id = (
        SELECT candidate.new_target_account_id
        FROM monobank_privatbank_target_repair_candidates candidate
        WHERE candidate.transfer_transaction_id = transaction_entries.transaction_id
    ),
    amount = (
        SELECT candidate.new_target_amount
        FROM monobank_privatbank_target_repair_candidates candidate
        WHERE candidate.transfer_transaction_id = transaction_entries.transaction_id
    ),
    exchange_rate = 1,
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT transfer_transaction_id
    FROM monobank_privatbank_target_repair_candidates
)
    AND type = 'DEBIT'
    AND account_id IN (
        SELECT old_target_account_id
        FROM monobank_privatbank_target_repair_candidates
    )
    AND deleted_at IS NULL
    AND original_transaction_id IS NULL;

UPDATE transaction_entries
SET
    original_transaction_id = transaction_id,
    transaction_id = (
        SELECT candidate.transfer_transaction_id
        FROM monobank_privatbank_target_repair_candidates candidate
        WHERE candidate.privatbank_income_transaction_id = transaction_entries.transaction_id
    ),
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT privatbank_income_transaction_id
    FROM monobank_privatbank_target_repair_candidates
)
    AND deleted_at IS NULL
    AND original_transaction_id IS NULL;

UPDATE transactions
SET
    consolidation_parent_transaction_id = (
        SELECT candidate.transfer_transaction_id
        FROM monobank_privatbank_target_repair_candidates candidate
        WHERE candidate.privatbank_income_transaction_id = transactions.id
    ),
    updated_at = unixepoch()
WHERE id IN (
    SELECT privatbank_income_transaction_id
    FROM monobank_privatbank_target_repair_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

SELECT
    'transfer_targets_repaired' AS repair_step,
    COUNT(*) AS repaired_transfer_targets
FROM transactions transfer
INNER JOIN monobank_privatbank_target_repair_candidates candidate ON
    candidate.transfer_transaction_id = transfer.id
    AND transfer.to_account_id = candidate.new_target_account_id;

SELECT
    'transfer_entries_repaired' AS repair_step,
    COUNT(*) AS repaired_transfer_entries
FROM transaction_entries target_entry
INNER JOIN monobank_privatbank_target_repair_candidates candidate ON
    candidate.transfer_transaction_id = target_entry.transaction_id
    AND target_entry.account_id = candidate.new_target_account_id
WHERE target_entry.type = 'DEBIT'
    AND target_entry.deleted_at IS NULL
    AND target_entry.original_transaction_id IS NULL;

SELECT
    'income_sources_moved' AS repair_step,
    COUNT(*) AS moved_income_sources
FROM transactions source
INNER JOIN monobank_privatbank_target_repair_candidates candidate ON
    candidate.privatbank_income_transaction_id = source.id
    AND source.consolidation_parent_transaction_id = candidate.transfer_transaction_id;

DROP TABLE IF EXISTS temp.monobank_privatbank_target_repair_candidates;

COMMIT;
