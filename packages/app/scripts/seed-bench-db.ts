/* eslint-disable no-console */
import Database from 'better-sqlite3';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const OUT = resolve(__dirname, '../.bench/fixture.db');
const TX_COUNT = 200_000;
const MERCHANT_COUNT = 50_000;
const COMMENT_COUNT = 5_000;
const CATEGORY_COUNT = 300;
const TAG_COUNT = 200;
const ACCOUNT_COUNT = 8;
const INSTRUMENT_COUNT = 4;
const MCC_COUNT = 150;
const SOFT_DELETE_RATIO = 0.1;
const NEEDS_EMBEDDING_RATIO = 0.25;
const MONTHS_BACK = 36;

const ensureDir = (file: string) => {
    const dir = dirname(file);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
};

const randomInt = (min: number, maxExclusive: number) => Math.floor(Math.random() * (maxExclusive - min)) + min;
const randomPick = <T>(items: T[]): T => items[randomInt(0, items.length)];

const MERCHANTS: string[] = Array.from({ length: MERCHANT_COUNT }, (_, i) => `Merchant ${i}`);
const COMMENTS: string[] = Array.from({ length: COMMENT_COUNT }, (_, i) => `Comment ${i}`);

export const seed = () => {
    ensureDir(OUT);
    if (existsSync(OUT)) {
        rmSync(OUT);
    }
    const db = new Database(OUT);
    db.pragma('journal_mode = WAL');
    db.pragma('synchronous = NORMAL');
    db.exec('CREATE TABLE instruments (id INTEGER PRIMARY KEY, code TEXT, created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)');
    db.exec(
        `CREATE TABLE accounts (id INTEGER PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,
            instrument_id INTEGER NOT NULL, is_active INTEGER NOT NULL DEFAULT 1,
            created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)`
    );
    db.exec(
        `CREATE TABLE categories (id INTEGER PRIMARY KEY, title TEXT NOT NULL DEFAULT '',
            title_search TEXT NOT NULL DEFAULT '', title_en TEXT, title_tags TEXT,
            tags_generated_at INTEGER, icon TEXT NOT NULL, parent_id INTEGER,
            is_default INTEGER NOT NULL DEFAULT 0, is_system_category INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)`
    );
    db.exec(
        `CREATE TABLE tags (id INTEGER PRIMARY KEY, title TEXT NOT NULL, title_search TEXT NOT NULL DEFAULT '',
            title_en TEXT, title_tags TEXT, tags_generated_at INTEGER,
            created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)`
    );
    db.exec(
        `CREATE TABLE mcc_categories (id INTEGER PRIMARY KEY, code TEXT NOT NULL, short_description TEXT NOT NULL,
            full_description TEXT NOT NULL, created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)`
    );
    db.exec(
        `CREATE TABLE transactions (id INTEGER PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL,
            external_id TEXT, operated_at INTEGER NOT NULL, comment TEXT NOT NULL DEFAULT '',
            to_account_id INTEGER, from_account_id INTEGER, exchange_rate REAL NOT NULL,
            external_source TEXT, needs_embedding INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)`
    );
    db.exec(
        `CREATE TABLE transaction_entries (id INTEGER PRIMARY KEY, type TEXT NOT NULL,
            account_id INTEGER NOT NULL, category_id INTEGER, mcc_category_id INTEGER,
            transaction_id INTEGER NOT NULL, amount INTEGER NOT NULL, external_id TEXT,
            exchange_rate REAL NOT NULL DEFAULT 1, to_iban TEXT,
            created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)`
    );
    db.exec(
        `CREATE TABLE transaction_tags (transaction_id INTEGER NOT NULL, tag_id INTEGER NOT NULL,
            PRIMARY KEY (transaction_id, tag_id))`
    );
    db.exec(
        `CREATE TABLE exchange_rates (id INTEGER PRIMARY KEY, source TEXT,
            base_instrument_id INTEGER NOT NULL, quote_instrument_id INTEGER NOT NULL,
            rate INTEGER NOT NULL, created_at INTEGER, updated_at INTEGER, deleted_at INTEGER)`
    );
    const now = Math.floor(Date.now() / 1000);
    for (let i = 1; i <= INSTRUMENT_COUNT; i++) {
        db.prepare('INSERT INTO instruments (id, code, created_at, updated_at) VALUES (?, ?, ?, ?)').run(i, `INST${i}`, now, now);
    }
    for (let i = 1; i <= ACCOUNT_COUNT; i++) {
        db.prepare(
            'INSERT INTO accounts (id, type, title, instrument_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(i, 'BANK', `Account ${i}`, randomInt(1, INSTRUMENT_COUNT + 1), now, now);
    }
    for (let i = 1; i <= CATEGORY_COUNT; i++) {
        const title = `Category ${i}`;
        db.prepare(
            'INSERT INTO categories (id, title, title_search, icon, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(i, title, title.toLowerCase(), 'Wallet', now, now);
    }
    for (let i = 1; i <= TAG_COUNT; i++) {
        const title = `Tag ${i}`;
        db.prepare('INSERT INTO tags (id, title, title_search, created_at, updated_at) VALUES (?, ?, ?, ?, ?)').run(
            i,
            title,
            title.toLowerCase(),
            now,
            now
        );
    }
    for (let i = 1; i <= MCC_COUNT; i++) {
        db.prepare(
            'INSERT INTO mcc_categories (id, code, short_description, full_description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).run(i, String(5000 + i), `MCC ${i}`, `MCC Description ${i}`, now, now);
    }
    for (let base = 1; base <= INSTRUMENT_COUNT; base++) {
        for (let quote = 1; quote <= INSTRUMENT_COUNT; quote++) {
            if (base === quote) {
                continue;
            }
            db.prepare(
                'INSERT INTO exchange_rates (base_instrument_id, quote_instrument_id, rate, created_at, updated_at) VALUES (?, ?, ?, ?, ?)'
            ).run(base, quote, 1_000_000, now, now);
        }
    }
    const operatedMin = now - MONTHS_BACK * 30 * 86400;
    const insertTx = db.prepare(
        `INSERT INTO transactions (type, title, operated_at, comment, to_account_id, from_account_id, exchange_rate, needs_embedding, created_at, updated_at, deleted_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertEntry = db.prepare(
        `INSERT INTO transaction_entries (type, account_id, category_id, mcc_category_id, transaction_id, amount, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    const insertTagJoin = db.prepare('INSERT OR IGNORE INTO transaction_tags (transaction_id, tag_id) VALUES (?, ?)');
    const batch = db.transaction(() => {
        for (let i = 1; i <= TX_COUNT; i++) {
            const hasTitle = Math.random() < 0.9;
            const title = hasTitle ? randomPick(MERCHANTS) : '';
            const comment = hasTitle ? '' : randomPick(COMMENTS);
            const operatedAt = randomInt(operatedMin, now);
            const isSoftDeleted = Math.random() < SOFT_DELETE_RATIO;
            const deletedAt = isSoftDeleted ? operatedAt + 86400 : null;
            const needsEmbedding = !isSoftDeleted && Math.random() < NEEDS_EMBEDDING_RATIO ? 1 : 0;
            const toAccount = randomInt(1, ACCOUNT_COUNT + 1);
            insertTx.run('EXPENSE', title, operatedAt, comment, toAccount, null, 1.0, needsEmbedding, now, now, deletedAt);
            insertEntry.run(
                'CREDIT',
                toAccount,
                randomInt(1, CATEGORY_COUNT + 1),
                Math.random() < 0.3 ? randomInt(1, MCC_COUNT + 1) : null,
                i,
                randomInt(100_000, 100_000_000),
                now,
                now
            );
            if (Math.random() < 0.3) {
                insertTagJoin.run(i, randomInt(1, TAG_COUNT + 1));
            }
        }
    });
    console.log(`Seeding ${TX_COUNT} transactions...`);
    batch();
    console.log(`Seed complete. Fixture at ${OUT}`);
    db.close();
};

seed();
