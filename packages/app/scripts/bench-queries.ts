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
