import { syncAccountBalanceRefresherLayer } from '@app/cloud-sync/layer/sync-account-balance-refresher.layer';
import { FakeCloudTransport, TestSeedService, buildTestDb, makeTestDbLayer, resetTestDb } from '@budgie-at/test-kit';
import { Db, PERSONAL_SYNC_ZONE, SyncApplyService, SyncResetRepository, SyncRestoreReconciliationService } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import { testDb } from '../../harness';

import { deviceLayer, expectBalancesMatchLedger, onDevice, pullDevice, pushDevice, readOutboxRows, refreshAllBalances } from './apply-harness';

import type { DB } from '@budgie/contracts';

const OPERATED_AT = new Date('2026-10-02T10:00:00Z');

const reconciliationLayer = Layer.mergeAll(
    deviceLayer,
    SyncResetRepository.layer,
    SyncRestoreReconciliationService.layer.pipe(Layer.provide(SyncApplyService.layer.pipe(Layer.provide(syncAccountBalanceRefresherLayer))))
);

const onRestoredDevice = <A, E>(database: DB, effect: Effect.Effect<A, E, Db | SyncApplyService | SyncRestoreReconciliationService | SyncResetRepository>) =>
    effect.pipe(Effect.provide(reconciliationLayer), Effect.provideService(Db, database));

const readTitles = (database: DB) =>
    database.$client
        .unsafe<{ readonly title: string }>(`SELECT title FROM transactions WHERE deleted_at IS NULL ORDER BY title`)
        .pipe(Effect.map(rows => rows.map(({ title }) => title)));

const readOutbox = (database: DB) => readOutboxRows(database).pipe(Effect.map(rows => rows.filter(({ recordType }) => recordType !== 'Category')));

const readSyncId = (database: DB, title: string) =>
    database.$client
        .unsafe<{ readonly syncId: string }>(`SELECT sync_id AS syncId FROM transactions WHERE title = ?`, [title])
        .pipe(Effect.map(([row]) => row.syncId));

const fullFetch = (database: DB, cloud: FakeCloudTransport, deviceId: string) =>
    onDevice(
        database,
        Effect.gen(function* () {
            const applyService = yield* SyncApplyService;

            for (const batch of cloud.pull(deviceId)) {
                yield* applyService.apply({ records: batch.records, deletions: [] });
            }
        })
    );

const restoreAndReconcile = (restored: DB, cloud: FakeCloudTransport) =>
    onRestoredDevice(
        restored,
        Effect.gen(function* () {
            const reconciliation = yield* SyncRestoreReconciliationService;

            yield* reconciliation.prepare(true);
            yield* fullFetch(restored, cloud, 'device-restored').pipe(Effect.provideService(Db, restored));

            return yield* reconciliation.complete(PERSONAL_SYNC_ZONE);
        })
    );

const acquireRestoredDevice = Effect.acquireRelease(
    Effect.promise(() => buildTestDb(null)),
    ({ dispose }) => Effect.promise(dispose)
).pipe(Effect.map(({ database }) => database));

const setupBackup = Effect.gen(function* () {
    const preRestore = yield* Db;
    const restored = yield* acquireRestoredDevice;
    const cloud = new FakeCloudTransport();
    const seed = new TestSeedService(testDb);

    yield* resetTestDb(preRestore);
    yield* resetTestDb(restored);

    const account = yield* seed.account({ title: 'Cash' });

    yield* seed.manualExpense({ accountId: account.id, amount: 5_000_000, operatedAt: OPERATED_AT, title: 'Cafe' });
    yield* seed.manualExpense({ accountId: account.id, amount: 7_000_000, operatedAt: OPERATED_AT, title: 'Lunch' });
    yield* refreshAllBalances(testDb);
    yield* pushDevice(testDb, cloud);
    yield* pullDevice(preRestore, cloud, 'device-b');
    yield* pullDevice(restored, cloud, 'device-backup');

    return { preRestore, restored, cloud, seed, account };
});

describe('cloud-sync/restore-reset reconciliation', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('restored backup against a newer zone', it => {
        it.effect('keeps a transaction deleted elsewhere deleted after restoring an older backup', () =>
            Effect.gen(function* () {
                const { restored, cloud } = yield* setupBackup;
                const cafeSyncId = yield* readSyncId(testDb, 'Cafe');

                yield* testDb.$client.unsafe(`DELETE FROM transaction_entries WHERE transaction_id = (SELECT id FROM transactions WHERE sync_id = ?)`, [cafeSyncId]);
                yield* testDb.$client.unsafe(`DELETE FROM transactions WHERE sync_id = ?`, [cafeSyncId]);
                yield* refreshAllBalances(testDb);
                cloud.remove('Transaction', PERSONAL_SYNC_ZONE, cafeSyncId);

                expect(yield* readTitles(restored)).toEqual(['Cafe', 'Lunch']);

                const results = yield* restoreAndReconcile(restored, cloud);

                expect(results.flatMap(result => result.deleted['Transaction'] ?? [])).toEqual([cafeSyncId]);
                expect(yield* readTitles(restored)).toEqual(['Lunch']);
                expect(yield* readTitles(testDb)).toEqual(['Lunch']);
                expect(yield* readOutbox(restored)).toEqual([]);
                yield* expectBalancesMatchLedger(restored);
                yield* expectBalancesMatchLedger(testDb);
            })
        );

        it.effect('lets a row edited in the zone after the backup win over the restored snapshot', () =>
            Effect.gen(function* () {
                const { restored, cloud } = yield* setupBackup;

                yield* testDb.$client.unsafe(`UPDATE transactions SET title = 'Lunch edited' WHERE title = 'Lunch'`);
                yield* pushDevice(testDb, cloud);
                yield* restoreAndReconcile(restored, cloud);

                expect(yield* readTitles(restored)).toEqual(['Cafe', 'Lunch edited']);
                expect(yield* readOutbox(restored)).toEqual([]);
                yield* expectBalancesMatchLedger(restored);
                yield* expectBalancesMatchLedger(testDb);
            })
        );

        it.effect('does not resurrect a row that only exists in the pre-restore safety copy', () =>
            Effect.gen(function* () {
                const { preRestore, restored, cloud, account } = yield* setupBackup;
                const preRestoreSeed = new TestSeedService(preRestore);

                yield* preRestoreSeed.manualExpense({ accountId: account.id, amount: 1_000_000, operatedAt: OPERATED_AT, title: 'Only in safety copy' });

                expect((yield* readOutboxRows(preRestore)).length).toBeGreaterThan(0);

                yield* onRestoredDevice(preRestore, Effect.flatMap(SyncResetRepository, repository => repository.clearSyncState()));

                expect(yield* readOutboxRows(preRestore)).toEqual([]);

                yield* restoreAndReconcile(restored, cloud);
                yield* pullDevice(testDb, cloud, 'device-a');

                expect(yield* readTitles(restored)).toEqual(['Cafe', 'Lunch']);
                expect(yield* readTitles(testDb)).toEqual(['Cafe', 'Lunch']);
                expect(yield* readOutbox(restored)).toEqual([]);
                yield* expectBalancesMatchLedger(restored);
            })
        );

        it.effect('uploads only rows the zone never held and keeps rows the zone holds out of the outbox', () =>
            Effect.gen(function* () {
                const { restored, cloud, account } = yield* setupBackup;
                const restoredSeed = new TestSeedService(restored);

                const restoredAccount = yield* restored.$client
                    .unsafe<{ readonly id: number }>(`SELECT id FROM accounts WHERE sync_id = ?`, [account.syncId ?? ''])
                    .pipe(Effect.map(([row]) => row));

                yield* restoredSeed.manualExpense({ accountId: restoredAccount.id, amount: 2_000_000, operatedAt: OPERATED_AT, title: 'Created after restore' });
                yield* restored.$client.unsafe(`DELETE FROM sync_outbox`);
                yield* refreshAllBalances(restored);
                yield* restoreAndReconcile(restored, cloud);

                const outbox = yield* readOutbox(restored);
                const localOnlySyncId = yield* readSyncId(restored, 'Created after restore');

                expect(outbox.filter(({ recordType }) => recordType === 'Transaction').map(({ syncId }) => syncId)).toEqual([localOnlySyncId]);
                expect(outbox.some(({ recordType }) => recordType === 'Account')).toBe(false);
                expect(yield* readTitles(restored)).toEqual(['Cafe', 'Created after restore', 'Lunch']);
                yield* expectBalancesMatchLedger(restored);
            })
        );
    });
});
