PRAGMA foreign_keys = ON;

BEGIN IMMEDIATE;

DROP TABLE IF EXISTS temp.monobank_same_bank_currency_conversion_candidates;

CREATE TEMP TABLE monobank_same_bank_currency_conversion_candidates (
    expense_transaction_id INTEGER NOT NULL PRIMARY KEY,
    income_transaction_id INTEGER NOT NULL,
    expense_entry_id INTEGER NOT NULL,
    income_entry_id INTEGER NOT NULL,
    source_account_id INTEGER NOT NULL,
    target_account_id INTEGER NOT NULL,
    source_amount INTEGER NOT NULL,
    target_amount INTEGER NOT NULL,
    source_entry_exchange_rate REAL NOT NULL,
    target_entry_exchange_rate REAL NOT NULL,
    source_entry_to_iban TEXT,
    operated_at INTEGER NOT NULL,
    title TEXT NOT NULL,
    exchange_rate REAL NOT NULL,
    delta_seconds INTEGER NOT NULL,
    marker_external_id TEXT NOT NULL,
    canonical_transaction_id INTEGER
);

WITH expense_entries AS (
    SELECT
        expense.id AS expense_transaction_id,
        expense.title,
        expense.operated_at,
        expense_entry.id AS expense_entry_id,
        expense_entry.account_id AS source_account_id,
        expense_entry.amount AS source_amount,
        expense_entry.exchange_rate AS source_entry_exchange_rate,
        expense_entry.to_iban AS source_entry_to_iban,
        expense_account.instrument_id AS source_instrument_id,
        COALESCE(NULLIF(expense_account.external_source, ''), expense.external_source) AS bank_source,
        expense_mcc.mcc_group_id AS mcc_group_id
    FROM transactions expense
    INNER JOIN transaction_entries expense_entry ON
        expense_entry.transaction_id = expense.id
        AND expense_entry.deleted_at IS NULL
        AND expense_entry.original_transaction_id IS NULL
        AND expense_entry.type = 'CREDIT'
    INNER JOIN accounts expense_account ON
        expense_account.id = expense_entry.account_id
        AND expense_account.deleted_at IS NULL
    LEFT JOIN mcc_categories expense_mcc ON expense_entry.mcc_category_id = expense_mcc.id
    WHERE expense.deleted_at IS NULL
        AND expense.consolidation_parent_transaction_id IS NULL
        AND expense.type = 'EXPENSE'
        AND expense_entry.amount > 0
        AND COALESCE(NULLIF(expense_account.external_source, ''), expense.external_source) = 'MONOBANK'
        AND NOT EXISTS (
            SELECT 1
            FROM transaction_entries moved_expense_entry
            WHERE moved_expense_entry.transaction_id = expense.id
                AND moved_expense_entry.deleted_at IS NULL
                AND moved_expense_entry.original_transaction_id IS NOT NULL
        )
), income_entries AS (
    SELECT
        income.id AS income_transaction_id,
        income.operated_at,
        income_entry.id AS income_entry_id,
        income_entry.account_id AS target_account_id,
        income_entry.amount AS target_amount,
        income_entry.exchange_rate AS target_entry_exchange_rate,
        income_account.instrument_id AS target_instrument_id,
        COALESCE(NULLIF(income_account.external_source, ''), income.external_source) AS bank_source,
        income_mcc.mcc_group_id AS mcc_group_id
    FROM transactions income
    INNER JOIN transaction_entries income_entry ON
        income_entry.transaction_id = income.id
        AND income_entry.deleted_at IS NULL
        AND income_entry.original_transaction_id IS NULL
        AND income_entry.type = 'DEBIT'
    INNER JOIN accounts income_account ON
        income_account.id = income_entry.account_id
        AND income_account.deleted_at IS NULL
    LEFT JOIN mcc_categories income_mcc ON income_entry.mcc_category_id = income_mcc.id
    WHERE income.deleted_at IS NULL
        AND income.consolidation_parent_transaction_id IS NULL
        AND income.type = 'INCOME'
        AND income_entry.amount > 0
        AND COALESCE(NULLIF(income_account.external_source, ''), income.external_source) = 'MONOBANK'
        AND NOT EXISTS (
            SELECT 1
            FROM transaction_entries moved_income_entry
            WHERE moved_income_entry.transaction_id = income.id
                AND moved_income_entry.deleted_at IS NULL
                AND moved_income_entry.original_transaction_id IS NOT NULL
        )
), ranked_candidates AS (
    SELECT
        expense.expense_transaction_id,
        income.income_transaction_id,
        expense.expense_entry_id,
        income.income_entry_id,
        expense.source_account_id,
        income.target_account_id,
        expense.source_amount,
        income.target_amount,
        expense.source_entry_exchange_rate,
        income.target_entry_exchange_rate,
        expense.source_entry_to_iban,
        expense.operated_at,
        expense.title,
        expense.source_amount * 1.0 / income.target_amount AS exchange_rate,
        ABS(income.operated_at - expense.operated_at) AS delta_seconds,
        'repair:monobank-same-bank-currency:' || expense.expense_transaction_id || ':' || income.income_transaction_id AS marker_external_id,
        ROW_NUMBER() OVER (
            PARTITION BY expense.expense_transaction_id
            ORDER BY
                ABS(income.operated_at - expense.operated_at),
                income.income_transaction_id
        ) AS expense_rank,
        ROW_NUMBER() OVER (
            PARTITION BY income.income_transaction_id
            ORDER BY
                ABS(income.operated_at - expense.operated_at),
                expense.expense_transaction_id
        ) AS income_rank
    FROM expense_entries expense
    INNER JOIN income_entries income ON
        income.target_account_id != expense.source_account_id
        AND income.bank_source = expense.bank_source
        AND income.target_instrument_id != expense.source_instrument_id
        AND (expense.source_entry_to_iban IS NULL OR expense.source_entry_to_iban = '')
        AND ABS(income.operated_at - expense.operated_at) <= 60
        AND (expense.mcc_group_id IS NULL OR expense.mcc_group_id = 10)
        AND (income.mcc_group_id IS NULL OR income.mcc_group_id = 10)
)
INSERT INTO monobank_same_bank_currency_conversion_candidates (
    expense_transaction_id,
    income_transaction_id,
    expense_entry_id,
    income_entry_id,
    source_account_id,
    target_account_id,
    source_amount,
    target_amount,
    source_entry_exchange_rate,
    target_entry_exchange_rate,
    source_entry_to_iban,
    operated_at,
    title,
    exchange_rate,
    delta_seconds,
    marker_external_id
)
SELECT
    expense_transaction_id,
    income_transaction_id,
    expense_entry_id,
    income_entry_id,
    source_account_id,
    target_account_id,
    source_amount,
    target_amount,
    source_entry_exchange_rate,
    target_entry_exchange_rate,
    source_entry_to_iban,
    operated_at,
    title,
    exchange_rate,
    delta_seconds,
    marker_external_id
FROM ranked_candidates
WHERE expense_rank = 1
    AND income_rank = 1;

SELECT
    'candidate_count' AS repair_step,
    COUNT(*) AS conversions_to_repair
FROM monobank_same_bank_currency_conversion_candidates;

SELECT
    candidate.expense_transaction_id,
    candidate.income_transaction_id,
    source_account.title AS source_account_title,
    target_account.title AS target_account_title,
    candidate.source_amount,
    candidate.target_amount,
    candidate.exchange_rate,
    datetime(candidate.operated_at, 'unixepoch') AS operated_at,
    candidate.delta_seconds
FROM monobank_same_bank_currency_conversion_candidates candidate
INNER JOIN accounts source_account ON source_account.id = candidate.source_account_id
INNER JOIN accounts target_account ON target_account.id = candidate.target_account_id
ORDER BY candidate.operated_at, candidate.expense_transaction_id;

INSERT INTO transactions (
    type,
    title,
    external_id,
    operated_at,
    comment,
    to_account_id,
    from_account_id,
    exchange_rate,
    external_source,
    needs_embedding,
    consolidation_parent_transaction_id,
    consolidation_type,
    updated_by
)
SELECT
    'TRANSFER',
    title,
    marker_external_id,
    operated_at,
    '',
    target_account_id,
    source_account_id,
    exchange_rate,
    NULL,
    0,
    NULL,
    'TRANSFER_PAIR',
    NULL
FROM monobank_same_bank_currency_conversion_candidates;

UPDATE monobank_same_bank_currency_conversion_candidates
SET canonical_transaction_id = (
    SELECT transfer.id
    FROM transactions transfer
    WHERE transfer.external_id = monobank_same_bank_currency_conversion_candidates.marker_external_id
);

INSERT INTO transaction_entries (
    transaction_id,
    account_id,
    type,
    amount,
    external_id,
    exchange_rate,
    to_iban,
    category_id,
    mcc_category_id,
    original_transaction_id
)
SELECT
    canonical_transaction_id,
    source_account_id,
    'CREDIT',
    source_amount,
    NULL,
    source_entry_exchange_rate,
    source_entry_to_iban,
    NULL,
    NULL,
    NULL
FROM monobank_same_bank_currency_conversion_candidates;

INSERT INTO transaction_entries (
    transaction_id,
    account_id,
    type,
    amount,
    external_id,
    exchange_rate,
    to_iban,
    category_id,
    mcc_category_id,
    original_transaction_id
)
SELECT
    canonical_transaction_id,
    target_account_id,
    'DEBIT',
    target_amount,
    NULL,
    target_entry_exchange_rate,
    NULL,
    NULL,
    NULL,
    NULL
FROM monobank_same_bank_currency_conversion_candidates;

INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id, is_primary)
SELECT DISTINCT
    candidate.canonical_transaction_id,
    source_tag.tag_id,
    0
FROM monobank_same_bank_currency_conversion_candidates candidate
INNER JOIN transaction_tags source_tag ON
    source_tag.transaction_id IN (candidate.expense_transaction_id, candidate.income_transaction_id);

UPDATE transaction_entries
SET
    original_transaction_id = transaction_id,
    transaction_id = (
        SELECT candidate.canonical_transaction_id
        FROM monobank_same_bank_currency_conversion_candidates candidate
        WHERE candidate.expense_transaction_id = transaction_entries.transaction_id
            OR candidate.income_transaction_id = transaction_entries.transaction_id
    ),
    updated_at = unixepoch()
WHERE transaction_id IN (
    SELECT expense_transaction_id
    FROM monobank_same_bank_currency_conversion_candidates
    UNION
    SELECT income_transaction_id
    FROM monobank_same_bank_currency_conversion_candidates
)
    AND deleted_at IS NULL
    AND original_transaction_id IS NULL;

UPDATE transactions
SET
    consolidation_parent_transaction_id = (
        SELECT candidate.canonical_transaction_id
        FROM monobank_same_bank_currency_conversion_candidates candidate
        WHERE candidate.expense_transaction_id = transactions.id
            OR candidate.income_transaction_id = transactions.id
    ),
    updated_at = unixepoch()
WHERE id IN (
    SELECT expense_transaction_id
    FROM monobank_same_bank_currency_conversion_candidates
    UNION
    SELECT income_transaction_id
    FROM monobank_same_bank_currency_conversion_candidates
)
    AND deleted_at IS NULL
    AND consolidation_parent_transaction_id IS NULL;

UPDATE transactions
SET
    external_id = NULL,
    updated_at = unixepoch()
WHERE id IN (
    SELECT canonical_transaction_id
    FROM monobank_same_bank_currency_conversion_candidates
)
    AND external_id IN (
        SELECT marker_external_id
        FROM monobank_same_bank_currency_conversion_candidates
    );

SELECT
    'canonical_transfers_created' AS repair_step,
    COUNT(*) AS canonical_transfer_count
FROM transactions transfer
INNER JOIN monobank_same_bank_currency_conversion_candidates candidate ON
    candidate.canonical_transaction_id = transfer.id
WHERE transfer.type = 'TRANSFER'
    AND transfer.consolidation_type = 'TRANSFER_PAIR'
    AND transfer.deleted_at IS NULL
    AND transfer.consolidation_parent_transaction_id IS NULL;

SELECT
    'source_transactions_parented' AS repair_step,
    COUNT(*) AS parented_source_transaction_count
FROM transactions source
INNER JOIN monobank_same_bank_currency_conversion_candidates candidate ON
    source.id IN (candidate.expense_transaction_id, candidate.income_transaction_id)
    AND source.consolidation_parent_transaction_id = candidate.canonical_transaction_id;

SELECT
    'source_entries_moved' AS repair_step,
    COUNT(*) AS moved_source_entry_count
FROM transaction_entries source_entry
INNER JOIN monobank_same_bank_currency_conversion_candidates candidate ON
    source_entry.original_transaction_id IN (candidate.expense_transaction_id, candidate.income_transaction_id)
    AND source_entry.transaction_id = candidate.canonical_transaction_id
WHERE source_entry.deleted_at IS NULL;

DROP TABLE IF EXISTS temp.monobank_same_bank_currency_conversion_candidates;

COMMIT;
