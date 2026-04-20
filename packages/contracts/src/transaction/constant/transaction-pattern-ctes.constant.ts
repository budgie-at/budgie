// Params: tzOffset, tzOffset, type, entryType, recencyTimestamp
export const PATTERN_GROUPS_CTE = `
    SELECT t.title, a.id AS account_id, a.instrument_id,
           te.category_id, cat.title AS cat_title, cat.icon AS cat_icon,
           mcc.short_description AS mcc_short_description,
           CAST(strftime('%d', t.operated_at + ?, 'unixepoch') AS INTEGER) AS day_of_month,
           strftime('%Y-%m', t.operated_at + ?, 'unixepoch') AS year_month,
           t.id AS tx_id, te.amount, t.operated_at
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    INNER JOIN accounts a ON a.id = te.account_id
    LEFT JOIN categories cat ON cat.id = te.category_id
    LEFT JOIN mcc_categories mcc ON mcc.id = te.mcc_category_id
    WHERE t.type = ? AND te.type = ? AND t.deleted_at IS NULL
      AND a.type != 'DEBT' AND t.operated_at >= ? AND t.title != ''
`;

// Params: (none)
export const PATTERN_DAY_AGG_CTE = `
    SELECT title, account_id, instrument_id, day_of_month,
           COUNT(DISTINCT tx_id) AS day_count
    FROM groups
    GROUP BY title, account_id, instrument_id, day_of_month
`;

// Params: (none)
export const PATTERN_MODE_DAY_CTE = `
    SELECT title, account_id, instrument_id,
           day_of_month AS mode_day_of_month,
           day_count AS mode_day_count,
           ROW_NUMBER() OVER (PARTITION BY title, account_id ORDER BY day_count DESC, day_of_month ASC) AS rk
    FROM day_agg
`;

// Params: (none)
export const PATTERN_OVERALL_AGG_CTE = `
    SELECT title, account_id, instrument_id,
           COUNT(DISTINCT year_month) AS occurrence_count,
           COUNT(DISTINCT tx_id) AS total_tx_count,
           MAX(amount) AS max_amount, MIN(amount) AS min_amount,
           MAX(operated_at) AS last_occurrence
    FROM groups
    GROUP BY title, account_id, instrument_id
`;

// Params: MIN_MONTHLY_OCCURRENCES, AMOUNT_VARIANCE_MULTIPLIER, DAY_CONCENTRATION_DENOMINATOR, DAY_CONCENTRATION_NUMERATOR
export const PATTERN_FILTERED_CTE = `
    SELECT oa.title, oa.account_id, oa.instrument_id,
           oa.occurrence_count, oa.total_tx_count, oa.max_amount, oa.min_amount, oa.last_occurrence,
           m.mode_day_of_month, m.mode_day_count
    FROM overall_agg oa
    INNER JOIN mode_day m ON m.title = oa.title AND m.account_id = oa.account_id AND m.rk = 1
    WHERE oa.occurrence_count >= ?
      AND oa.max_amount <= oa.min_amount * ?
      AND m.mode_day_count * ? >= oa.total_tx_count * ?
`;

// Params: type, entryType
export const PATTERN_ALL_TIME_CTE = `
    SELECT t.title, a.id AS account_id,
           te.category_id, cat.title AS cat_title, cat.icon AS cat_icon,
           mcc.short_description AS mcc_short_description,
           a.instrument_id, t.id AS tx_id, te.amount, t.operated_at
    FROM transactions t
    INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
    INNER JOIN accounts a ON a.id = te.account_id
    LEFT JOIN categories cat ON cat.id = te.category_id
    LEFT JOIN mcc_categories mcc ON mcc.id = te.mcc_category_id
    WHERE t.type = ? AND te.type = ? AND t.deleted_at IS NULL
      AND a.type != 'DEBT' AND t.title != ''
`;

// Params: (none)
export const PATTERN_LATEST_OVERALL_CTE = `
    SELECT at.title, at.account_id, at.tx_id, at.operated_at, at.amount,
           at.category_id, at.cat_title, at.cat_icon, at.mcc_short_description, at.instrument_id,
           ROW_NUMBER() OVER (PARTITION BY at.title, at.account_id ORDER BY at.operated_at DESC, at.tx_id DESC) AS rk
    FROM all_time at
    INNER JOIN filtered f ON f.title = at.title AND f.account_id = at.account_id
`;

// Params: displayMonth
export const PATTERN_LATEST_DISPLAY_CTE = `
    SELECT g.title, g.account_id, g.tx_id, g.day_of_month,
           ROW_NUMBER() OVER (PARTITION BY g.title, g.account_id ORDER BY g.operated_at DESC, g.tx_id DESC) AS rk
    FROM groups g
    INNER JOIN filtered f ON f.title = g.title AND f.account_id = g.account_id
    WHERE g.year_month = ?
`;
