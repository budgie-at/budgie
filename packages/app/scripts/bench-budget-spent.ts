/* eslint-disable no-console */
import Database from 'better-sqlite3';
import { existsSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

import { benchPercentile, benchRandomInt, ensureBenchDir } from './bench-util';

const DB_PATH = resolve(__dirname, '../.bench/budget-fixture.db');
const WARMUP_ITERATIONS = 5;
const TIMED_ITERATIONS = 10;
const P95_THRESHOLD_MS = 20;

const PLAIN_EXPENSE_COUNT = 912;
const REFUND_EXPENSE_COUNT = 20;
const TRANSFER_COUNT = 15;
const ADJUSTMENT_COUNT = 15;
const INCOME_COUNT = 20;
const CONSOLIDATED_REFUND_PAIRS = 8;
const TOTAL_TX_TARGET = 1000;

const PLAIN_EXPENSE_MIN_MICROS = 1_000_000;
const PLAIN_EXPENSE_MAX_MICROS = 100_000_000;
const REFUND_MIN_MICROS = 500_000;
const REFUND_MAX_MICROS = 25_000_000;
const OUTSIDE_PERIOD_AMOUNT = 99_999_999_999;
const SOFT_DELETED_AMOUNT = 77_777_777_777;

const ACCOUNT_ID = 1;
const INSTRUMENT_ID = 1;
const PERIOD_START = new Date('2026-05-01T00:00:00Z');
const PERIOD_END = new Date('2026-06-01T00:00:00Z');
const PERIOD_START_SEC = Math.floor(PERIOD_START.getTime() / 1000);
const PERIOD_END_SEC = Math.floor(PERIOD_END.getTime() / 1000);
const OUTSIDE_PERIOD_SEC = Math.floor(new Date('2026-04-15T12:00:00Z').getTime() / 1000);

interface CategoryFixture {
    readonly id: number;
    readonly title: string;
    readonly limitMicros: number | null;
}

const CATEGORY_FIXTURES: readonly CategoryFixture[] = [
    { id: 1, title: 'Food', limitMicros: 200_000_000 },
    { id: 2, title: 'Transport', limitMicros: 100_000_000 },
    { id: 3, title: 'Entertainment', limitMicros: 50_000_000 },
    { id: 4, title: 'Health', limitMicros: null },
    { id: 5, title: 'Misc', limitMicros: null }
];

const CATEGORY_IDS = CATEGORY_FIXTURES.map(fixture => fixture.id);

const randomOperatedAt = () => benchRandomInt(PERIOD_START_SEC, PERIOD_END_SEC);
const pickCategoryId = (cursor: { value: number }): number => {
    const next = CATEGORY_IDS[cursor.value % CATEGORY_IDS.length];
    cursor.value += 1;

    return next;
};

interface SeedCounters {
    nextTxId: number;
    nextEntryId: number;
    categoryCursor: { value: number };
}

interface ExpectedTotals {
    plainExpenseSum: number;
    refundSum: number;
    consolidationNet: number;
    byCategory: Map<number, number>;
}

const addToCategoryTotal = (totals: ExpectedTotals, categoryId: number, amount: number): void => {
    totals.byCategory.set(categoryId, (totals.byCategory.get(categoryId) ?? 0) + amount);
};

const buildSchema = (db: Database.Database): void => {
    db.exec(`
        CREATE TABLE accounts (
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL,
            instrument_id INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted_at INTEGER
        );

        CREATE TABLE categories (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted_at INTEGER
        );

        CREATE TABLE budgets (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            period TEXT NOT NULL,
            period_start_day INTEGER NOT NULL DEFAULT 1,
            use_last_day_of_month INTEGER NOT NULL DEFAULT 0,
            overall_limit INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted_at INTEGER
        );

        CREATE TABLE budget_category_limits (
            id INTEGER PRIMARY KEY,
            budget_id INTEGER NOT NULL,
            category_id INTEGER NOT NULL,
            limit_amount INTEGER NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted_at INTEGER
        );

        CREATE TABLE transactions (
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL,
            title TEXT NOT NULL DEFAULT '',
            operated_at INTEGER NOT NULL,
            exchange_rate REAL NOT NULL DEFAULT 1,
            consolidation_parent_transaction_id INTEGER,
            consolidation_type TEXT,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted_at INTEGER
        );

        CREATE TABLE transaction_entries (
            id INTEGER PRIMARY KEY,
            type TEXT NOT NULL,
            account_id INTEGER NOT NULL,
            transaction_id INTEGER NOT NULL,
            category_id INTEGER,
            amount INTEGER NOT NULL,
            exchange_rate REAL NOT NULL DEFAULT 1,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            deleted_at INTEGER
        );

        CREATE INDEX transactions_type_operated_idx
            ON transactions(type, operated_at)
            WHERE deleted_at IS NULL;

        CREATE INDEX transaction_entries_transaction_idx
            ON transaction_entries(transaction_id);

        CREATE INDEX transaction_entries_category_idx
            ON transaction_entries(category_id)
            WHERE category_id IS NOT NULL;

        CREATE INDEX transaction_entries_category_type_idx
            ON transaction_entries(category_id, type)
            WHERE category_id IS NOT NULL;
    `);
};

interface TxRow {
    readonly type: 'EXPENSE' | 'TRANSFER' | 'ADJUSTMENT' | 'INCOME';
    readonly operatedAt: number;
    readonly parentTransactionId?: number;
    readonly consolidationType?: 'REFUND';
    readonly deletedAt?: number;
}

interface EntryRow {
    readonly entryType: 'DEBIT' | 'CREDIT';
    readonly amount: number;
    readonly categoryId?: number;
}

const insertAccount = (db: Database.Database, nowSec: number): void => {
    db.prepare(`INSERT INTO accounts (id, type, instrument_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`).run(
        ACCOUNT_ID,
        'BANK',
        INSTRUMENT_ID,
        nowSec,
        nowSec
    );
};

const insertCategories = (db: Database.Database, nowSec: number): void => {
    const stmt = db.prepare(`INSERT INTO categories (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)`);
    for (const category of CATEGORY_FIXTURES) {
        stmt.run(category.id, category.title, nowSec, nowSec);
    }
};

const insertBudgetWithCategoryLimits = (db: Database.Database, nowSec: number): void => {
    db.prepare(
        `INSERT INTO budgets (id, name, period, period_start_day, use_last_day_of_month, overall_limit, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(1, 'Monthly Budget', 'MONTHLY', 1, 0, 500_000_000, nowSec, nowSec);

    const limitStmt = db.prepare(
        `INSERT INTO budget_category_limits (budget_id, category_id, limit_amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
    );
    for (const category of CATEGORY_FIXTURES) {
        if (category.limitMicros !== null) {
            limitStmt.run(1, category.id, category.limitMicros, nowSec, nowSec);
        }
    }
};

const insertTransaction = (db: Database.Database, counters: SeedCounters, nowSec: number, tx: TxRow, entry: EntryRow): number => {
    const txId = counters.nextTxId++;
    const entryId = counters.nextEntryId++;

    db.prepare(
        `INSERT INTO transactions
            (id, type, operated_at, exchange_rate, consolidation_parent_transaction_id, consolidation_type, created_at, updated_at, deleted_at)
            VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?)`
    ).run(txId, tx.type, tx.operatedAt, tx.parentTransactionId ?? null, tx.consolidationType ?? null, nowSec, nowSec, tx.deletedAt ?? null);

    db.prepare(
        `INSERT INTO transaction_entries (id, type, account_id, transaction_id, category_id, amount, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(entryId, entry.entryType, ACCOUNT_ID, txId, entry.categoryId ?? null, entry.amount, nowSec, nowSec);

    return txId;
};

const seedPlainExpenses = (db: Database.Database, counters: SeedCounters, nowSec: number, totals: ExpectedTotals): void => {
    for (let i = 0; i < PLAIN_EXPENSE_COUNT; i++) {
        const amount = benchRandomInt(PLAIN_EXPENSE_MIN_MICROS, PLAIN_EXPENSE_MAX_MICROS);
        const categoryId = pickCategoryId(counters.categoryCursor);
        insertTransaction(
            db,
            counters,
            nowSec,
            { type: 'EXPENSE', operatedAt: randomOperatedAt() },
            { entryType: 'CREDIT', amount, categoryId }
        );
        totals.plainExpenseSum += amount;
        addToCategoryTotal(totals, categoryId, amount);
    }
};

const seedNegativeRefunds = (db: Database.Database, counters: SeedCounters, nowSec: number, totals: ExpectedTotals): void => {
    for (let i = 0; i < REFUND_EXPENSE_COUNT; i++) {
        const amount = -benchRandomInt(REFUND_MIN_MICROS, REFUND_MAX_MICROS);
        const categoryId = pickCategoryId(counters.categoryCursor);
        insertTransaction(
            db,
            counters,
            nowSec,
            { type: 'EXPENSE', operatedAt: randomOperatedAt() },
            { entryType: 'CREDIT', amount, categoryId }
        );
        totals.refundSum += amount;
        addToCategoryTotal(totals, categoryId, amount);
    }
};

const seedExcludedKind = (
    db: Database.Database,
    counters: SeedCounters,
    nowSec: number,
    kind: 'TRANSFER' | 'ADJUSTMENT' | 'INCOME',
    count: number
): void => {
    const entryType = kind === 'INCOME' ? 'DEBIT' : 'CREDIT';
    for (let i = 0; i < count; i++) {
        const amount = benchRandomInt(PLAIN_EXPENSE_MIN_MICROS, PLAIN_EXPENSE_MAX_MICROS);
        const categoryId = pickCategoryId(counters.categoryCursor);
        insertTransaction(db, counters, nowSec, { type: kind, operatedAt: randomOperatedAt() }, { entryType, amount, categoryId });
    }
};

const seedConsolidatedRefundPairs = (db: Database.Database, counters: SeedCounters, nowSec: number, totals: ExpectedTotals): void => {
    for (let i = 0; i < CONSOLIDATED_REFUND_PAIRS; i++) {
        const parentAmount = benchRandomInt(PLAIN_EXPENSE_MIN_MICROS, PLAIN_EXPENSE_MAX_MICROS);
        const childAmount = -parentAmount;
        const operatedAt = randomOperatedAt();
        const categoryId = pickCategoryId(counters.categoryCursor);
        const parentTxId = insertTransaction(
            db,
            counters,
            nowSec,
            { type: 'EXPENSE', operatedAt, consolidationType: 'REFUND' },
            { entryType: 'CREDIT', amount: parentAmount, categoryId }
        );
        insertTransaction(
            db,
            counters,
            nowSec,
            { type: 'EXPENSE', operatedAt, parentTransactionId: parentTxId, consolidationType: 'REFUND' },
            { entryType: 'CREDIT', amount: childAmount, categoryId }
        );
        totals.consolidationNet += parentAmount + childAmount;
        addToCategoryTotal(totals, categoryId, parentAmount + childAmount);
    }
};

const seedNegativeControls = (db: Database.Database, counters: SeedCounters, nowSec: number): void => {
    insertTransaction(
        db,
        counters,
        nowSec,
        { type: 'EXPENSE', operatedAt: OUTSIDE_PERIOD_SEC },
        { entryType: 'CREDIT', amount: OUTSIDE_PERIOD_AMOUNT, categoryId: CATEGORY_IDS[0] }
    );
    insertTransaction(
        db,
        counters,
        nowSec,
        { type: 'EXPENSE', operatedAt: randomOperatedAt(), deletedAt: nowSec },
        { entryType: 'CREDIT', amount: SOFT_DELETED_AMOUNT, categoryId: CATEGORY_IDS[0] }
    );
};

interface SeedResult {
    readonly db: Database.Database;
    readonly expectedSpent: number;
    readonly expectedByCategory: ReadonlyMap<number, number>;
    readonly txCount: number;
}

const seed = (): SeedResult => {
    ensureBenchDir(DB_PATH);
    if (existsSync(DB_PATH)) {
        rmSync(DB_PATH);
    }
    const db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');

    buildSchema(db);

    const nowSec = Math.floor(Date.now() / 1000);
    insertAccount(db, nowSec);
    insertCategories(db, nowSec);
    insertBudgetWithCategoryLimits(db, nowSec);

    const counters: SeedCounters = { nextTxId: 1, nextEntryId: 1, categoryCursor: { value: 0 } };
    const totals: ExpectedTotals = { plainExpenseSum: 0, refundSum: 0, consolidationNet: 0, byCategory: new Map() };

    const batch = db.transaction(() => {
        seedPlainExpenses(db, counters, nowSec, totals);
        seedNegativeRefunds(db, counters, nowSec, totals);
        seedExcludedKind(db, counters, nowSec, 'TRANSFER', TRANSFER_COUNT);
        seedExcludedKind(db, counters, nowSec, 'ADJUSTMENT', ADJUSTMENT_COUNT);
        seedExcludedKind(db, counters, nowSec, 'INCOME', INCOME_COUNT);
        seedConsolidatedRefundPairs(db, counters, nowSec, totals);
        seedNegativeControls(db, counters, nowSec);
    });

    batch();

    const expectedSpent = totals.plainExpenseSum + totals.refundSum + totals.consolidationNet;
    const txCount = counters.nextTxId - 1;

    return { db, expectedSpent, expectedByCategory: totals.byCategory, txCount };
};

const BUDGET_SPENT_OVERALL_QUERY = `
    SELECT COALESCE(SUM(te.amount), 0) AS total
    FROM transaction_entries te
    INNER JOIN transactions t ON t.id = te.transaction_id
    WHERE t.type = 'EXPENSE'
      AND te.type = 'CREDIT'
      AND t.deleted_at IS NULL
      AND te.deleted_at IS NULL
      AND t.operated_at >= ?
      AND t.operated_at < ?
`;

const BUDGET_SPENT_BY_CATEGORY_QUERY = `
    SELECT te.category_id AS categoryId, COALESCE(SUM(te.amount), 0) AS spent
    FROM transaction_entries te
    INNER JOIN transactions t ON t.id = te.transaction_id
    WHERE t.type = 'EXPENSE'
      AND te.type = 'CREDIT'
      AND t.deleted_at IS NULL
      AND te.deleted_at IS NULL
      AND te.category_id IS NOT NULL
      AND t.operated_at >= ?
      AND t.operated_at < ?
    GROUP BY te.category_id
`;

interface OverallQueryRow {
    readonly total: number;
}

interface ByCategoryQueryRow {
    readonly categoryId: number;
    readonly spent: number;
}

interface OverallTimings {
    readonly p50: number;
    readonly p95: number;
    readonly sample: number;
}

interface ByCategoryTimings {
    readonly p50: number;
    readonly p95: number;
    readonly rows: ReadonlyMap<number, number>;
}

const runOverall = (db: Database.Database): OverallTimings => {
    const stmt = db.prepare(BUDGET_SPENT_OVERALL_QUERY);
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        stmt.get(PERIOD_START_SEC, PERIOD_END_SEC);
    }
    const timings: number[] = [];
    let sample = 0;
    for (let i = 0; i < TIMED_ITERATIONS; i++) {
        const start = process.hrtime.bigint();
        const row = stmt.get(PERIOD_START_SEC, PERIOD_END_SEC) as OverallQueryRow;
        const end = process.hrtime.bigint();
        timings.push(Number(end - start) / 1_000_000);
        sample = row.total;
    }

    return { p50: benchPercentile(timings, 0.5), p95: benchPercentile(timings, 0.95), sample };
};

const runByCategory = (db: Database.Database): ByCategoryTimings => {
    const stmt = db.prepare(BUDGET_SPENT_BY_CATEGORY_QUERY);
    for (let i = 0; i < WARMUP_ITERATIONS; i++) {
        stmt.all(PERIOD_START_SEC, PERIOD_END_SEC);
    }
    const timings: number[] = [];
    let rows = new Map<number, number>();
    for (let i = 0; i < TIMED_ITERATIONS; i++) {
        const start = process.hrtime.bigint();
        const result = stmt.all(PERIOD_START_SEC, PERIOD_END_SEC) as ByCategoryQueryRow[];
        const end = process.hrtime.bigint();
        timings.push(Number(end - start) / 1_000_000);
        rows = new Map(result.map(row => [row.categoryId, row.spent]));
    }

    return { p50: benchPercentile(timings, 0.5), p95: benchPercentile(timings, 0.95), rows };
};

const compareByCategory = (expected: ReadonlyMap<number, number>, actual: ReadonlyMap<number, number>): string[] => {
    const mismatches: string[] = [];
    const allCategoryIds = new Set([...expected.keys(), ...actual.keys()]);
    for (const categoryId of allCategoryIds) {
        const expectedValue = expected.get(categoryId) ?? 0;
        const actualValue = actual.get(categoryId) ?? 0;
        if (expectedValue !== actualValue) {
            mismatches.push(`  categoryId=${categoryId} expected=${expectedValue} actual=${actualValue}`);
        }
    }

    return mismatches;
};

const formatCategoryMap = (map: ReadonlyMap<number, number>): string =>
    [...map.entries()]
        .sort(([a], [b]) => a - b)
        .map(([categoryId, spent]) => `categoryId=${categoryId} spent=${spent}`)
        .join(', ');

const BASE_INSTRUMENT_ID = 1;
const EUR_INSTRUMENT_ID = 2;
const GBP_INSTRUMENT_ID = 3;
const EUR_TO_BASE_RATE = 1.1;

interface SpentEntryRowInterface {
    readonly amount: number;
    readonly categoryId: number | null;
    readonly instrumentId: number;
    readonly rate: number | null;
}

const convertAmountToBase = (amount: number, rate: number | null): number => {
    if (rate === null) {
        return amount;
    }

    return Math.round(amount * rate);
};

const computeBudgetSpent = (
    entries: SpentEntryRowInterface[],
    baseInstrumentId: number
): { spentOverall: number; fallbackCount: number } => {
    let spentOverall = 0;
    let fallbackCount = 0;
    for (const entry of entries) {
        const isBase = entry.instrumentId === baseInstrumentId;
        const rate = isBase ? 1 : entry.rate;
        if (!isBase && rate === null) {
            fallbackCount += 1;
        }
        spentOverall += convertAmountToBase(entry.amount, rate ?? null);
    }

    return { spentOverall, fallbackCount };
};

const runFxMixedInstrumentHappyPath = (): boolean => {
    const baseAmount = 100_000_000;
    const eurAmount = 50_000_000;
    const entries: SpentEntryRowInterface[] = [
        { amount: baseAmount, categoryId: 1, instrumentId: BASE_INSTRUMENT_ID, rate: null },
        { amount: eurAmount, categoryId: 2, instrumentId: EUR_INSTRUMENT_ID, rate: EUR_TO_BASE_RATE }
    ];
    const expectedSpentOverall = baseAmount + Math.round(eurAmount * EUR_TO_BASE_RATE);
    const { spentOverall, fallbackCount } = computeBudgetSpent(entries, BASE_INSTRUMENT_ID);
    const pass = spentOverall === expectedSpentOverall && fallbackCount === 0;
    if (pass) {
        console.log('  PASS: mixed-instrument happy path (USD + EUR with valid rate)');
    } else {
        console.log('  FAIL: mixed-instrument happy path');
        console.log(`    expected spentOverall=${expectedSpentOverall} fallbackCount=0`);
        console.log(`    got     spentOverall=${spentOverall} fallbackCount=${fallbackCount}`);
    }

    return pass;
};

const runFxMissingRateFallback = (): boolean => {
    const baseAmount = 80_000_000;
    const gbpAmount = 30_000_000;
    const entries: SpentEntryRowInterface[] = [
        { amount: baseAmount, categoryId: 1, instrumentId: BASE_INSTRUMENT_ID, rate: null },
        { amount: gbpAmount, categoryId: 2, instrumentId: GBP_INSTRUMENT_ID, rate: null }
    ];
    const expectedSpentOverall = baseAmount + gbpAmount;
    const { spentOverall, fallbackCount } = computeBudgetSpent(entries, BASE_INSTRUMENT_ID);
    const pass = spentOverall === expectedSpentOverall && fallbackCount === 1;
    if (pass) {
        console.log('  PASS: missing-rate fallback (GBP with no rate row → raw amount + fallbackCount=1)');
    } else {
        console.log('  FAIL: missing-rate fallback');
        console.log(`    expected spentOverall=${expectedSpentOverall} fallbackCount=1`);
        console.log(`    got     spentOverall=${spentOverall} fallbackCount=${fallbackCount}`);
    }

    return pass;
};

const run = (): void => {
    console.log('Seeding budget bench fixture...');
    const { db, expectedSpent, expectedByCategory, txCount } = seed();
    console.log(`  Seeded ${txCount} transactions (target ${TOTAL_TX_TARGET}).`);
    console.log(`  Composition:`);
    console.log(`    plain EXPENSE rows .......... ${PLAIN_EXPENSE_COUNT}`);
    console.log(`    negative-refund EXPENSE rows  ${REFUND_EXPENSE_COUNT}`);
    console.log(`    TRANSFER rows ............... ${TRANSFER_COUNT}`);
    console.log(`    ADJUSTMENT rows ............. ${ADJUSTMENT_COUNT}`);
    console.log(`    INCOME rows ................. ${INCOME_COUNT}`);
    console.log(`    consolidated refund pairs ... ${CONSOLIDATED_REFUND_PAIRS} (2 rows each)`);
    console.log(`  Plus 1 outside-period EXPENSE and 1 soft-deleted EXPENSE as negative controls.`);
    console.log(
        `  Categories seeded: ${CATEGORY_FIXTURES.map(c => `${c.id}=${c.title}${c.limitMicros !== null ? ' (limit)' : ''}`).join(', ')}`
    );

    const overall = runOverall(db);
    const byCategory = runByCategory(db);

    console.log('');
    console.log('Correctness check (spentOverall):');
    console.log(`  expected = ${expectedSpent}`);
    console.log(`  query    = ${overall.sample}`);

    const overallCorrectnessPass = overall.sample === expectedSpent;
    if (overallCorrectnessPass) {
        console.log('  Correctness: PASS');
    } else {
        console.log('  Correctness: FAIL');
    }

    console.log('');
    console.log('Correctness check (spentByCategory):');
    console.log(`  expected = ${formatCategoryMap(expectedByCategory)}`);
    console.log(`  query    = ${formatCategoryMap(byCategory.rows)}`);

    const mismatches = compareByCategory(expectedByCategory, byCategory.rows);
    const byCategoryCorrectnessPass = mismatches.length === 0;
    if (byCategoryCorrectnessPass) {
        console.log('  Correctness: PASS');
    } else {
        console.log('  Correctness: FAIL');
        for (const line of mismatches) {
            console.log(line);
        }
    }

    console.log('');
    console.log('Performance check (overall spent query):');
    console.log(`  p50 = ${overall.p50.toFixed(3)} ms`);
    console.log(`  p95 = ${overall.p95.toFixed(3)} ms`);
    console.log(`  gate p95 < ${P95_THRESHOLD_MS} ms`);

    const overallPerfPass = overall.p95 < P95_THRESHOLD_MS;
    if (overallPerfPass) {
        console.log('  Performance: PASS');
    } else {
        console.log('  Performance: FAIL');
    }

    console.log('');
    console.log('Performance check (per-category spent query):');
    console.log(`  p50 = ${byCategory.p50.toFixed(3)} ms`);
    console.log(`  p95 = ${byCategory.p95.toFixed(3)} ms`);
    console.log(`  gate p95 < ${P95_THRESHOLD_MS} ms`);

    const byCategoryPerfPass = byCategory.p95 < P95_THRESHOLD_MS;
    if (byCategoryPerfPass) {
        console.log('  Performance: PASS');
    } else {
        console.log('  Performance: FAIL');
    }

    db.close();

    console.log('');
    console.log('Multi-currency conversion sub-tests:');
    const fxMixedPass = runFxMixedInstrumentHappyPath();
    const fxFallbackPass = runFxMissingRateFallback();

    const allPass =
        overallCorrectnessPass && byCategoryCorrectnessPass && overallPerfPass && byCategoryPerfPass && fxMixedPass && fxFallbackPass;
    if (!allPass) {
        process.exit(1);
    }
};

run();
