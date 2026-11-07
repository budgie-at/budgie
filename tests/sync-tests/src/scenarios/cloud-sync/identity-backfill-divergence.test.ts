import { TestSeedService, makeTestDbLayer } from '@budgie-at/test-kit';
import { Db, SYNC_IDENTITY_TABLES, SyncIdentityRepository, TransactionEntryEntityTable } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { testDb } from '../../harness';

import type { DB } from '@budgie/contracts';

const SHARED_CREATED_AT = 1_780_000_000;
const OPERATED_AT = new Date('2026-10-02T10:00:00Z');
const LINEAGE_ID = '4d3e6c52-0d58-4a62-9a64-3f6a1d2b7f10';
const IDENTITY_TABLES = ['accounts', 'transactions', 'transaction_entries', 'tags', 'transaction_tags'];

const stamp = (database: DB, tableName: string, id: number, createdAt: number) =>
    database.$client.unsafe(`UPDATE ${tableName} SET created_at = ? WHERE id = ?`, [createdAt, id]);

const seedTransaction = (database: DB, accountId: number, title: string, createdAt: number) =>
    Effect.gen(function* () {
        const transaction = yield* new TestSeedService(database).manualExpense({
            accountId,
            amount: 1_000_000,
            operatedAt: OPERATED_AT,
            title
        });
        const [entry] = yield* database
            .select()
            .from(TransactionEntryEntityTable)
            .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));

        yield* stamp(database, 'transactions', transaction.id, createdAt);
        yield* stamp(database, 'transaction_entries', entry.id, createdAt);

        return { transactionId: transaction.id, entryId: entry.id };
    });

const seedTag = (database: DB, title: string, createdAt: number) =>
    Effect.gen(function* () {
        const tag = yield* new TestSeedService(database).tag(title);

        yield* stamp(database, 'tags', tag.id, createdAt);

        return tag.id;
    });

const seedSharedHistory = (database: DB) =>
    Effect.gen(function* () {
        const seed = new TestSeedService(database);
        const account = yield* seed.account({ title: 'Cash' });

        yield* database.$client.unsafe(`UPDATE settings SET lineage_id = ?`, [LINEAGE_ID]);
        yield* stamp(database, 'accounts', account.id, SHARED_CREATED_AT);

        const shared = yield* seedTransaction(database, account.id, 'Shared', SHARED_CREATED_AT);
        const tagId = yield* seedTag(database, 'Shared tag', SHARED_CREATED_AT);

        yield* seed.transactionTag(shared.transactionId, tagId);

        return account.id;
    });

const divergeHistory = (database: DB, accountId: number, title: string, createdAt: number) =>
    Effect.gen(function* () {
        const transaction = yield* seedTransaction(database, accountId, title, createdAt);
        const tagId = yield* seedTag(database, `${title} tag`, createdAt);

        return [`transactions:${transaction.transactionId}`, `transaction_entries:${transaction.entryId}`, `tags:${tagId}`];
    });

const backfillIdentities = (database: DB) =>
    Effect.gen(function* () {
        yield* Effect.forEach(SYNC_IDENTITY_TABLES, ({ name }) => database.$client.unsafe(`UPDATE ${name} SET sync_id = NULL`), {
            discard: true
        });

        const syncIdentityRepository = yield* SyncIdentityRepository;

        yield* syncIdentityRepository.backfill();

        const identities = new Map<string, string>();

        for (const tableName of IDENTITY_TABLES) {
            const rows = yield* database.$client.unsafe<{ readonly id: number; readonly syncId: string }>(
                `SELECT rowid AS id, sync_id AS syncId FROM ${tableName} ORDER BY rowid`
            );

            for (const row of rows) {
                identities.set(`${tableName}:${row.id}`, row.syncId);
            }
        }

        return identities;
    }).pipe(Effect.provide(SyncIdentityRepository.layer), Effect.provideService(Db, database));

describe('cloud-sync/identity-backfill-divergence', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two copies of one backup', it => {
        it.effect('backfill keeps shared rows identical and gives diverged rows with the same local id different sync ids', () =>
            Effect.gen(function* () {
                const otherDatabase = yield* Db;
                const accountId = yield* seedSharedHistory(testDb);
                const otherAccountId = yield* seedSharedHistory(otherDatabase);
                const divergedKeys = [
                    ...(yield* divergeHistory(testDb, accountId, 'Left', SHARED_CREATED_AT + 100)),
                    ...(yield* divergeHistory(otherDatabase, otherAccountId, 'Right', SHARED_CREATED_AT + 200))
                ];
                const leftIdentities = yield* backfillIdentities(testDb);
                const rightIdentities = yield* backfillIdentities(otherDatabase);
                const sharedKeys = [...leftIdentities.keys()].filter(key => !divergedKeys.includes(key));
                const uniqueDivergedKeys = [...new Set(divergedKeys)];

                expect(accountId).toBe(otherAccountId);
                expect(sharedKeys.length).toBeGreaterThanOrEqual(5);
                expect([...rightIdentities.keys()].sort()).toEqual([...leftIdentities.keys()].sort());
                expect(uniqueDivergedKeys).toHaveLength(3);

                for (const key of sharedKeys) {
                    expect(rightIdentities.get(key)).toBe(leftIdentities.get(key));
                }

                for (const key of uniqueDivergedKeys) {
                    expect(rightIdentities.get(key)).not.toBe(leftIdentities.get(key));
                }

                expect(new Set(leftIdentities.values()).size).toBe(leftIdentities.size);
                expect(new Set(rightIdentities.values()).size).toBe(rightIdentities.size);
            })
        );
    });
});
