/* eslint-disable no-console */
import Database from 'better-sqlite3';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const DB_PATH = resolve(__dirname, '../.bench/fixture.db');
const OUTPUT_PATH = resolve(__dirname, 'monthly-patterns-baseline.json');

const TYPE = 'EXPENSE';
const ENTRY_TYPE = 'CREDIT';
const TZ_OFFSET = 3600;
const DISPLAY_MONTH = '2026-03';
const DEFAULT_INSTRUMENT_ID = 1;
const RECENCY_TS = Math.floor(Date.now() / 1000) - 12 * 30 * 24 * 60 * 60;

const BANK_SQL = `
SELECT
  "transaction_entries"."category_id" AS "categoryId",
  "categories"."title" AS "categoryTitle",
  "categories"."icon" AS "categoryIcon",
  (SELECT t2.id FROM transactions t2
   INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
   WHERE t2.title = "transactions"."title" AND te2.account_id = "accounts"."id"
     AND t2.deleted_at IS NULL AND t2.type = ? AND te2.type = ?
     AND strftime('%Y-%m', t2.operated_at + ?, 'unixepoch') = ?
   ORDER BY t2.operated_at DESC LIMIT 1) AS "latestTransactionId",
  COUNT(DISTINCT strftime('%Y-%m', "transactions"."operated_at" + ?, 'unixepoch')) AS "occurrenceCount",
  MAX("transactions"."operated_at") AS "lastOccurrence",
  (SELECT CAST(strftime('%d', t3.operated_at + ?, 'unixepoch') AS INTEGER)
   FROM transactions t3 WHERE t3.id = (SELECT t2x.id FROM transactions t2x
   INNER JOIN transaction_entries te2x ON te2x.transaction_id = t2x.id
   WHERE t2x.title = "transactions"."title" AND te2x.account_id = "accounts"."id"
     AND t2x.deleted_at IS NULL AND t2x.type = ? AND te2x.type = ?
     AND strftime('%Y-%m', t2x.operated_at + ?, 'unixepoch') = ?
   ORDER BY t2x.operated_at DESC LIMIT 1)) AS "dayOfMonth",
  (SELECT t6.id FROM transactions t6
   INNER JOIN transaction_entries te6 ON te6.transaction_id = t6.id
   WHERE t6.title = "transactions"."title" AND te6.account_id = "accounts"."id"
     AND t6.deleted_at IS NULL AND t6.type = ? AND te6.type = ?
   ORDER BY t6.operated_at DESC LIMIT 1) AS "latestOverallTransactionId",
  "accounts"."id" AS "accountId",
  "accounts"."instrument_id" AS "instrumentId",
  "mcc_categories"."short_description" AS "mccCategoryTitle",
  (SELECT t2y.title FROM transactions t2y WHERE t2y.id = (SELECT t2z.id FROM transactions t2z
   INNER JOIN transaction_entries te2z ON te2z.transaction_id = t2z.id
   WHERE t2z.title = "transactions"."title" AND te2z.account_id = "accounts"."id"
     AND t2z.deleted_at IS NULL AND t2z.type = ? AND te2z.type = ?
     AND strftime('%Y-%m', t2z.operated_at + ?, 'unixepoch') = ?
   ORDER BY t2z.operated_at DESC LIMIT 1)) AS "title",
  (SELECT te2a.amount FROM transactions t2a
   INNER JOIN transaction_entries te2a ON te2a.transaction_id = t2a.id
   WHERE t2a.title = "transactions"."title" AND te2a.account_id = "accounts"."id"
     AND t2a.deleted_at IS NULL AND t2a.type = ? AND te2a.type = ?
   ORDER BY t2a.operated_at DESC LIMIT 1) * COALESCE(
    (SELECT er.rate * 1.0 FROM exchange_rates er
     WHERE er.base_instrument_id = "accounts"."instrument_id" AND er.quote_instrument_id = ? AND er.deleted_at IS NULL
     ORDER BY er.created_at DESC LIMIT 1),
    (SELECT 1.0 / er.rate FROM exchange_rates er
     WHERE er.base_instrument_id = ? AND er.quote_instrument_id = "accounts"."instrument_id" AND er.deleted_at IS NULL
     ORDER BY er.created_at DESC LIMIT 1),
    1.0) AS "latestAmount",
  (SELECT CAST(strftime('%d', t5.operated_at + ?, 'unixepoch') AS INTEGER)
   FROM transactions t5 INNER JOIN transaction_entries te5 ON te5.transaction_id = t5.id
   WHERE t5.title = "transactions"."title" AND te5.account_id = "accounts"."id"
     AND t5.deleted_at IS NULL AND t5.type = ? AND te5.type = ? AND t5.operated_at >= ?
   GROUP BY CAST(strftime('%d', t5.operated_at + ?, 'unixepoch') AS INTEGER)
   ORDER BY COUNT(DISTINCT t5.id) DESC LIMIT 1) AS "modeDayOfMonth",
  (SELECT t7.title FROM transactions t7 WHERE t7.id = (SELECT t6b.id FROM transactions t6b
   INNER JOIN transaction_entries te6b ON te6b.transaction_id = t6b.id
   WHERE t6b.title = "transactions"."title" AND te6b.account_id = "accounts"."id"
     AND t6b.deleted_at IS NULL AND t6b.type = ? AND te6b.type = ?
   ORDER BY t6b.operated_at DESC LIMIT 1)) AS "latestOverallTitle"
FROM "transactions"
INNER JOIN "transaction_entries" ON "transaction_entries"."transaction_id" = "transactions"."id"
AND "transaction_entries"."deleted_at" IS NULL
INNER JOIN "accounts" ON "accounts"."id" = "transaction_entries"."account_id"
LEFT JOIN "categories" ON "categories"."id" = "transaction_entries"."category_id"
LEFT JOIN "mcc_categories" ON "mcc_categories"."id" = "transaction_entries"."mcc_category_id"
WHERE "transactions"."type" = ?
  AND "transactions"."deleted_at" IS NULL
  AND "transaction_entries"."type" = ?
  AND "accounts"."type" != 'DEBT'
  AND "transactions"."operated_at" >= ?
  AND "transactions"."title" != ''
GROUP BY "transactions"."title", "accounts"."id"
HAVING COUNT(DISTINCT strftime('%Y-%m', "transactions"."operated_at" + ?, 'unixepoch')) >= 3
  AND MAX("transaction_entries"."amount") <= MIN("transaction_entries"."amount") * 2
  AND (SELECT MAX(dc) FROM (SELECT COUNT(DISTINCT t4.id) AS dc
       FROM transactions t4 INNER JOIN transaction_entries te4 ON te4.transaction_id = t4.id
       WHERE t4.title = "transactions"."title" AND te4.account_id = "accounts"."id"
         AND t4.deleted_at IS NULL AND t4.type = ? AND te4.type = ? AND t4.operated_at >= ?
       GROUP BY CAST(strftime('%d', t4.operated_at + ?, 'unixepoch') AS INTEGER))) * 10
     >= COUNT(DISTINCT "transactions"."id") * 4
ORDER BY COUNT(DISTINCT strftime('%Y-%m', "transactions"."operated_at" + ?, 'unixepoch')) DESC,
         MAX("transactions"."operated_at") DESC
`;

const BANK_PARAMS = [
    TYPE,
    ENTRY_TYPE,
    TZ_OFFSET,
    DISPLAY_MONTH,
    TZ_OFFSET,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    TZ_OFFSET,
    DISPLAY_MONTH,
    TYPE,
    ENTRY_TYPE,
    TYPE,
    ENTRY_TYPE,
    TZ_OFFSET,
    DISPLAY_MONTH,
    TYPE,
    ENTRY_TYPE,
    DEFAULT_INSTRUMENT_ID,
    DEFAULT_INSTRUMENT_ID,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    RECENCY_TS,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    TYPE,
    ENTRY_TYPE,
    RECENCY_TS,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    RECENCY_TS,
    TZ_OFFSET,
    TZ_OFFSET
];

const MANUAL_SQL = `
SELECT
  "transaction_entries"."category_id" AS "categoryId",
  "categories"."title" AS "categoryTitle",
  "categories"."icon" AS "categoryIcon",
  (SELECT t2.id FROM transactions t2
   INNER JOIN transaction_entries te2 ON te2.transaction_id = t2.id
   WHERE t2.comment = "transactions"."comment"
     AND te2.category_id = "transaction_entries"."category_id"
     AND te2.account_id = "accounts"."id"
     AND t2.title = '' AND t2.deleted_at IS NULL AND t2.type = ? AND te2.type = ?
     AND strftime('%Y-%m', t2.operated_at + ?, 'unixepoch') = ?
   ORDER BY t2.operated_at DESC LIMIT 1) AS "latestTransactionId",
  COUNT(DISTINCT strftime('%Y-%m', "transactions"."operated_at" + ?, 'unixepoch')) AS "occurrenceCount",
  MAX("transactions"."operated_at") AS "lastOccurrence",
  (SELECT CAST(strftime('%d', t3.operated_at + ?, 'unixepoch') AS INTEGER)
   FROM transactions t3 WHERE t3.id = (SELECT t2x.id FROM transactions t2x
   INNER JOIN transaction_entries te2x ON te2x.transaction_id = t2x.id
   WHERE t2x.comment = "transactions"."comment"
     AND te2x.category_id = "transaction_entries"."category_id"
     AND te2x.account_id = "accounts"."id"
     AND t2x.title = '' AND t2x.deleted_at IS NULL AND t2x.type = ? AND te2x.type = ?
     AND strftime('%Y-%m', t2x.operated_at + ?, 'unixepoch') = ?
   ORDER BY t2x.operated_at DESC LIMIT 1)) AS "dayOfMonth",
  (SELECT t6.id FROM transactions t6
   INNER JOIN transaction_entries te6 ON te6.transaction_id = t6.id
   WHERE t6.comment = "transactions"."comment"
     AND te6.category_id = "transaction_entries"."category_id"
     AND te6.account_id = "accounts"."id"
     AND t6.title = '' AND t6.deleted_at IS NULL AND t6.type = ? AND te6.type = ?
   ORDER BY t6.operated_at DESC LIMIT 1) AS "latestOverallTransactionId",
  "accounts"."id" AS "accountId",
  "accounts"."instrument_id" AS "instrumentId",
  NULL AS "mccCategoryTitle",
  "transactions"."comment" AS "title",
  (SELECT te2a.amount FROM transactions t2a
   INNER JOIN transaction_entries te2a ON te2a.transaction_id = t2a.id
   WHERE t2a.comment = "transactions"."comment"
     AND te2a.category_id = "transaction_entries"."category_id"
     AND te2a.account_id = "accounts"."id"
     AND t2a.title = '' AND t2a.deleted_at IS NULL AND t2a.type = ? AND te2a.type = ?
   ORDER BY t2a.operated_at DESC LIMIT 1) * COALESCE(
    (SELECT er.rate * 1.0 FROM exchange_rates er
     WHERE er.base_instrument_id = "accounts"."instrument_id" AND er.quote_instrument_id = ? AND er.deleted_at IS NULL
     ORDER BY er.created_at DESC LIMIT 1),
    (SELECT 1.0 / er.rate FROM exchange_rates er
     WHERE er.base_instrument_id = ? AND er.quote_instrument_id = "accounts"."instrument_id" AND er.deleted_at IS NULL
     ORDER BY er.created_at DESC LIMIT 1),
    1.0) AS "latestAmount",
  (SELECT CAST(strftime('%d', t5.operated_at + ?, 'unixepoch') AS INTEGER)
   FROM transactions t5 INNER JOIN transaction_entries te5 ON te5.transaction_id = t5.id
   WHERE t5.comment = "transactions"."comment"
     AND te5.category_id = "transaction_entries"."category_id"
     AND te5.account_id = "accounts"."id"
     AND t5.title = '' AND t5.deleted_at IS NULL AND t5.type = ? AND te5.type = ? AND t5.operated_at >= ?
   GROUP BY CAST(strftime('%d', t5.operated_at + ?, 'unixepoch') AS INTEGER)
   ORDER BY COUNT(DISTINCT t5.id) DESC LIMIT 1) AS "modeDayOfMonth",
  "transactions"."comment" AS "latestOverallTitle"
FROM "transactions"
INNER JOIN "transaction_entries" ON "transaction_entries"."transaction_id" = "transactions"."id"
AND "transaction_entries"."deleted_at" IS NULL
INNER JOIN "accounts" ON "accounts"."id" = "transaction_entries"."account_id"
LEFT JOIN "categories" ON "categories"."id" = "transaction_entries"."category_id"
WHERE "transactions"."type" = ?
  AND "transactions"."deleted_at" IS NULL
  AND "transaction_entries"."type" = ?
  AND "accounts"."type" != 'DEBT'
  AND "transactions"."operated_at" >= ?
  AND "transactions"."title" = ''
  AND "transactions"."comment" != ''
  AND "transaction_entries"."category_id" IS NOT NULL
GROUP BY "transactions"."comment", "transaction_entries"."category_id", "accounts"."id"
HAVING COUNT(DISTINCT strftime('%Y-%m', "transactions"."operated_at" + ?, 'unixepoch')) >= 3
  AND MAX("transaction_entries"."amount") <= MIN("transaction_entries"."amount") * 2
  AND (SELECT MAX(dc) FROM (SELECT COUNT(DISTINCT t4.id) AS dc
       FROM transactions t4 INNER JOIN transaction_entries te4 ON te4.transaction_id = t4.id
       WHERE t4.comment = "transactions"."comment"
         AND te4.category_id = "transaction_entries"."category_id"
         AND te4.account_id = "accounts"."id"
         AND t4.title = '' AND t4.deleted_at IS NULL AND t4.type = ? AND te4.type = ? AND t4.operated_at >= ?
       GROUP BY CAST(strftime('%d', t4.operated_at + ?, 'unixepoch') AS INTEGER))) * 10
     >= COUNT(DISTINCT "transactions"."id") * 4
ORDER BY COUNT(DISTINCT strftime('%Y-%m', "transactions"."operated_at" + ?, 'unixepoch')) DESC,
         MAX("transactions"."operated_at") DESC
`;

const MANUAL_PARAMS = [
    TYPE,
    ENTRY_TYPE,
    TZ_OFFSET,
    DISPLAY_MONTH,
    TZ_OFFSET,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    TZ_OFFSET,
    DISPLAY_MONTH,
    TYPE,
    ENTRY_TYPE,
    TYPE,
    ENTRY_TYPE,
    DEFAULT_INSTRUMENT_ID,
    DEFAULT_INSTRUMENT_ID,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    RECENCY_TS,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    RECENCY_TS,
    TZ_OFFSET,
    TYPE,
    ENTRY_TYPE,
    RECENCY_TS,
    TZ_OFFSET,
    TZ_OFFSET
];

const run = () => {
    const db = new Database(DB_PATH, { readonly: true });

    console.log('Running bank-synced baseline...');
    const bankRows = db.prepare(BANK_SQL).all(...BANK_PARAMS);
    console.log(`Bank path: ${bankRows.length} rows`);

    console.log('Running manual baseline...');
    const manualRows = db.prepare(MANUAL_SQL).all(...MANUAL_PARAMS);
    console.log(`Manual path: ${manualRows.length} rows`);

    const output = { bank: bankRows, manual: manualRows };
    writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
    console.log(`Baseline saved to ${OUTPUT_PATH}`);

    db.close();
};

run();
