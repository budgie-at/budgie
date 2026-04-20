/* eslint-disable no-console */
import Database from 'better-sqlite3';
import { resolve } from 'node:path';

const DB_PATH = resolve(__dirname, '../.bench/fixture.db');
const WARMUP_ITERATIONS = 5;
const TIMED_ITERATIONS = 10;

interface BenchInterface {
    readonly name: string;
    readonly sql: string;
    readonly params?: readonly unknown[];
}

const BENCHES: readonly BenchInterface[] = [
    {
        name: 'transaction_list_first_20',
        sql: `SELECT t.* FROM transactions t WHERE t.deleted_at IS NULL
              ORDER BY t.operated_at DESC, t.id DESC LIMIT 20`
    },
    {
        name: 'count_all_active',
        sql: `SELECT COUNT(*) AS c FROM transactions WHERE deleted_at IS NULL`
    },
    {
        name: 'count_pending_embedding',
        sql: `SELECT COUNT(*) AS c FROM transactions WHERE needs_embedding = 1 AND deleted_at IS NULL`
    },
    {
        name: 'pending_merchant_contexts_15',
        sql: `SELECT t.title, te.category_id, MAX(t.comment) AS comment,
                     GROUP_CONCAT(DISTINCT t.id) AS ids, MAX(t.operated_at) AS op
              FROM transactions t
              INNER JOIN transaction_entries te ON te.transaction_id = t.id AND te.deleted_at IS NULL
              WHERE t.deleted_at IS NULL AND t.needs_embedding = 1
                AND t.title != '' AND te.category_id IS NOT NULL
              GROUP BY t.title, te.category_id
              ORDER BY op DESC
              LIMIT 15`
    },
    {
        name: 'category_search_prefix',
        sql: `SELECT c.* FROM categories c
              LEFT JOIN transaction_entries te ON te.category_id = c.id
              WHERE c.title_search LIKE '%cat%' AND c.is_system_category = 0
              GROUP BY c.id ORDER BY COUNT(te.id) DESC`
    },
    {
        name: 'monthly_pattern_bank',
        sql: `
WITH groups AS (
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
),
day_agg AS (
    SELECT title, account_id, instrument_id, day_of_month,
           COUNT(DISTINCT tx_id) AS day_count
    FROM groups
    GROUP BY title, account_id, instrument_id, day_of_month
),
mode_day AS (
    SELECT title, account_id, instrument_id,
           day_of_month AS mode_day_of_month,
           day_count AS mode_day_count,
           ROW_NUMBER() OVER (PARTITION BY title, account_id ORDER BY day_count DESC, day_of_month ASC) AS rk
    FROM day_agg
),
overall_agg AS (
    SELECT title, account_id, instrument_id,
           COUNT(DISTINCT year_month) AS occurrence_count,
           COUNT(DISTINCT tx_id) AS total_tx_count,
           MAX(amount) AS max_amount, MIN(amount) AS min_amount,
           MAX(operated_at) AS last_occurrence
    FROM groups
    GROUP BY title, account_id, instrument_id
),
filtered AS (
    SELECT oa.title, oa.account_id, oa.instrument_id,
           oa.occurrence_count, oa.total_tx_count, oa.max_amount, oa.min_amount, oa.last_occurrence,
           m.mode_day_of_month, m.mode_day_count
    FROM overall_agg oa
    INNER JOIN mode_day m ON m.title = oa.title AND m.account_id = oa.account_id AND m.rk = 1
    WHERE oa.occurrence_count >= ?
      AND oa.max_amount <= oa.min_amount * ?
      AND m.mode_day_count * ? >= oa.total_tx_count * ?
),
latest_overall AS (
    SELECT g.title, g.account_id, g.tx_id, g.operated_at, g.amount,
           g.category_id, g.cat_title, g.cat_icon, g.mcc_short_description, g.instrument_id,
           ROW_NUMBER() OVER (PARTITION BY g.title, g.account_id ORDER BY g.operated_at DESC, g.tx_id DESC) AS rk
    FROM groups g
    INNER JOIN filtered f ON f.title = g.title AND f.account_id = g.account_id
),
latest_display AS (
    SELECT g.title, g.account_id, g.tx_id, g.day_of_month,
           ROW_NUMBER() OVER (PARTITION BY g.title, g.account_id ORDER BY g.operated_at DESC, g.tx_id DESC) AS rk
    FROM groups g
    INNER JOIN filtered f ON f.title = g.title AND f.account_id = g.account_id
    WHERE g.year_month = ?
)
SELECT lo.title, lo.account_id AS accountId, lo.instrument_id AS instrumentId,
       lo.category_id AS categoryId, lo.cat_title AS categoryTitle, lo.cat_icon AS categoryIcon,
       lo.mcc_short_description AS mccCategoryTitle,
       ld.tx_id AS latestTransactionId,
       lo.amount * COALESCE(
           (SELECT er.rate * 1.0 FROM exchange_rates er
            WHERE er.base_instrument_id = lo.instrument_id AND er.quote_instrument_id = ?
              AND er.deleted_at IS NULL ORDER BY er.created_at DESC LIMIT 1),
           (SELECT 1.0 / er.rate FROM exchange_rates er
            WHERE er.base_instrument_id = ? AND er.quote_instrument_id = lo.instrument_id
              AND er.deleted_at IS NULL ORDER BY er.created_at DESC LIMIT 1),
           1.0
       ) AS latestAmount,
       ld.day_of_month AS dayOfMonth,
       f.mode_day_of_month AS modeDayOfMonth,
       f.occurrence_count AS occurrenceCount,
       f.last_occurrence AS lastOccurrence,
       lo.tx_id AS latestOverallTransactionId,
       lo.title AS latestOverallTitle
FROM filtered f
INNER JOIN latest_overall lo ON lo.title = f.title AND lo.account_id = f.account_id AND lo.rk = 1
LEFT JOIN latest_display ld ON ld.title = f.title AND ld.account_id = f.account_id AND ld.rk = 1
ORDER BY f.occurrence_count DESC, f.last_occurrence DESC`,
        params: [
            3600,
            3600,
            'EXPENSE',
            'CREDIT',
            Math.floor(Date.now() / 1000) - 12 * 30 * 24 * 60 * 60,
            3,
            2,
            10,
            4,
            '2026-03',
            1,
            1
        ] as const
    }
];

const percentile = (values: number[], p: number) => {
    const sorted = [...values].sort((a, b) => a - b);
    const idx = Math.floor((sorted.length - 1) * p);

    return sorted[idx];
};

const runOne = (db: Database.Database, bench: BenchInterface) => {
    const stmt = db.prepare(bench.sql);
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        stmt.all(...(bench.params ?? []));
    }
    const timings: number[] = [];
    for (let i = 0; i < TIMED_ITERATIONS; i++) {
        const start = process.hrtime.bigint();
        stmt.all(...(bench.params ?? []));
        const end = process.hrtime.bigint();
        timings.push(Number(end - start) / 1_000_000);
    }

    return { p50: percentile(timings, 0.5), p95: percentile(timings, 0.95) };
};

const run = () => {
    const db = new Database(DB_PATH, { readonly: true });
    console.log(`| Bench | p50 (ms) | p95 (ms) |`);
    console.log(`|---|---:|---:|`);
    for (const bench of BENCHES) {
        const { p50, p95 } = runOne(db, bench);
        console.log(`| ${bench.name} | ${p50.toFixed(2)} | ${p95.toFixed(2)} |`);
    }
    db.close();
};

run();
