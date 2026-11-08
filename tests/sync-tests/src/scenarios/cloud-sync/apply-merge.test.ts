import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    Db,
    FakeCloudTransport,
    TestSeedService,
    assertStoredBalancesMatchLedger,
    makeTestDbLayer,
    testDb,
    pullDevice,
    pushDevice,
    readOutboxRows,
    refreshAllBalances,
    DEVICE_A,
    DEVICE_B,
    applyRuleCategory,
    categoryIds,
    mergeBothWays,
    pushSeededExpense,
    hydratedSnapshot
} from '../../harness';

import type { DB } from '@budgie/contracts';

const seedBaseline = (deviceB: DB, cloud: FakeCloudTransport) =>
    Effect.gen(function* () {
        const seeded = yield* pushSeededExpense(deviceB, cloud);

        yield* pullDevice(deviceB, cloud, DEVICE_B);
        yield* pullDevice(testDb, cloud, DEVICE_A);

        return seeded;
    });

const entryOf = (database: DB, title: string) =>
    database.$client
        .unsafe<{
            readonly amount: number;
            readonly categoryId: number | null;
            readonly categorySource: string;
            readonly entrySyncId: string;
        }>(
            `SELECT e.amount AS amount, e.category_id AS categoryId, e.category_source AS categorySource, e.sync_id AS entrySyncId
            FROM transaction_entries e INNER JOIN transactions t ON t.id = e.transaction_id WHERE t.title = ?`,
            [title]
        )
        .pipe(Effect.map(([entry]) => entry));

const transactionOf = (database: DB, title: string) =>
    database.$client
        .unsafe<{ readonly title: string; readonly deletedAt: number | null; readonly updatedBy: string | null }>(
            `SELECT title, deleted_at AS deletedAt, updated_by AS updatedBy FROM transactions WHERE title = ? OR title LIKE ?`,
            [title, `${title}%`]
        )
        .pipe(Effect.map(([transaction]) => transaction));

const tagTitlesOf = (database: DB) =>
    database.$client
        .unsafe<{ readonly title: string }>(
            `SELECT g.title AS title FROM transaction_tags tt INNER JOIN tags g ON g.id = tt.tag_id ORDER BY g.title`
        )
        .pipe(Effect.map(rows => rows.map(({ title }) => title)));

const seedRuleCategory = Effect.gen(function* () {
    const deviceB = yield* Db;
    const cloud = new FakeCloudTransport();
    const { transaction } = yield* seedBaseline(deviceB, cloud);

    return { deviceB, cloud, userCategory: yield* applyRuleCategory(transaction.id) };
});

describe('cloud-sync/apply-merge', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('keeps an amount edit from device A and a tag added on device B', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const { account, transaction } = yield* seedBaseline(deviceB, cloud);
                const seedB = new TestSeedService(deviceB);

                yield* testDb.$client.unsafe(`UPDATE transaction_entries SET amount = 7000000 WHERE transaction_id = ?`, [transaction.id]);
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);

                const tag = yield* seedB.tag('Coffee');
                const [remoteTransaction] = yield* deviceB.$client.unsafe<{ readonly id: number }>(`SELECT id FROM transactions`);

                yield* seedB.transactionTag(remoteTransaction.id, tag.id);
                yield* pullDevice(deviceB, cloud, DEVICE_B);

                const outboxAfterMerge = yield* readOutboxRows(deviceB);

                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                expect(account.id).toBeGreaterThan(0);
                expect(
                    outboxAfterMerge.some(row => row.recordType === 'Transaction' && row.changedColumns.includes('transaction_tags'))
                ).toBe(true);
                expect((yield* entryOf(deviceB, 'Cafe')).amount).toBe(7_000_000);
                expect((yield* entryOf(testDb, 'Cafe')).amount).toBe(7_000_000);
                expect(yield* tagTitlesOf(deviceB)).toEqual(['Coffee']);
                expect(yield* tagTitlesOf(testDb)).toEqual(['Coffee']);
                yield* assertStoredBalancesMatchLedger(deviceB);
                yield* assertStoredBalancesMatchLedger(testDb);
            })
        );

        it.effect('lets a deletion beat a concurrent edit while keeping the edited title', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();
                const { transaction } = yield* seedBaseline(deviceB, cloud);

                yield* testDb.$client.unsafe(`UPDATE transactions SET deleted_at = 1790000000 WHERE id = ?`, [transaction.id]);
                yield* refreshAllBalances(testDb);
                yield* pushDevice(testDb, cloud);
                yield* deviceB.$client.unsafe(`UPDATE transactions SET title = 'Dinner'`);
                yield* mergeBothWays(deviceB, cloud);

                for (const database of [deviceB, testDb]) {
                    const merged = yield* transactionOf(database, 'Dinner');

                    expect(merged.title).toBe('Dinner');
                    expect(merged.deletedAt).not.toBeNull();
                }

                yield* assertStoredBalancesMatchLedger(deviceB);
                yield* assertStoredBalancesMatchLedger(testDb);
            })
        );

        it.effect('prefers the user category over a rule category when device A applied a rule', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, userCategory } = yield* seedRuleCategory;
                yield* deviceB.$client.unsafe(`UPDATE transaction_entries SET category_id = ?, category_source = 'USER'`, [userCategory]);
                yield* pushDevice(deviceB, cloud);
                yield* pullDevice(testDb, cloud, DEVICE_A);

                const merged = yield* entryOf(testDb, 'Cafe');

                expect(merged.categoryId).toBe(userCategory);
                expect(merged.categorySource).toBe('USER');
                expect(yield* readOutboxRows(testDb)).toEqual([]);
                yield* assertStoredBalancesMatchLedger(testDb);
            })
        );

        it.effect('keeps the local user category when the incoming category came from a rule', () =>
            Effect.gen(function* () {
                const { deviceB, cloud, userCategory } = yield* seedRuleCategory;
                yield* pushDevice(testDb, cloud);
                yield* deviceB.$client.unsafe(`UPDATE transaction_entries SET category_id = ?, category_source = 'USER'`, [userCategory]);
                yield* mergeBothWays(deviceB, cloud);

                for (const database of [deviceB, testDb]) {
                    const merged = yield* entryOf(database, 'Cafe');

                    expect(merged.categoryId).toBe(userCategory);
                    expect(merged.categorySource).toBe('USER');
                }

                yield* assertStoredBalancesMatchLedger(deviceB);
            })
        );

        it.effect('merges a seeded category edited on both devices into one row', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* seedBaseline(deviceB, cloud);

                const [categoryId] = yield* categoryIds(testDb);
                const countBefore = yield* deviceB.$client.unsafe<{ readonly total: number }>(`SELECT COUNT(*) AS total FROM categories`);

                yield* testDb.$client.unsafe(`UPDATE categories SET title = 'Edited on A' WHERE id = ?`, [categoryId]);
                yield* deviceB.$client.unsafe(`UPDATE categories SET title = 'Edited on B' WHERE id = ?`, [categoryId]);
                yield* pushDevice(testDb, cloud);
                yield* mergeBothWays(deviceB, cloud);

                const countAfter = yield* deviceB.$client.unsafe<{ readonly total: number }>(`SELECT COUNT(*) AS total FROM categories`);
                const titleOn = (database: DB) =>
                    database.$client
                        .unsafe<{ readonly title: string }>(`SELECT title FROM categories WHERE id = ?`, [categoryId])
                        .pipe(Effect.map(([row]) => row.title));

                expect(countAfter[0].total).toBe(countBefore[0].total);
                expect(yield* titleOn(deviceB)).toBe('Edited on B');
                expect(yield* titleOn(testDb)).toBe('Edited on B');
                expect(Object.keys(yield* hydratedSnapshot(testDb))).toContain('categories');
            })
        );
    });
});
