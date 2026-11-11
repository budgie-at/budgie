import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import { Db } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { beforeEach, vi } from 'vitest';

import { DatabaseLifecycleService } from '../src/@generic/drizzle/service/database-lifecycle.service';
import { cloudSyncStateStoreLayer } from '../src/cloud-sync/layer/cloud-sync-state-store.layer';
import { DatabaseImportService } from '../src/import/service/database-import.service';

import { resetStorage, storage } from './fixture/expo-file-system-fake';
import { secrets } from './fixture/expo-secure-store-fake';
import { importDependenciesLayer } from './fixture/import-dependencies-layer';
import { inertDbLayer } from './fixture/inert-db-layer';

import type { CloudSyncStateInterface } from '@budgie/cloud-sync';

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('../src/@generic/drizzle/service/database-lifecycle.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseLifecycleService: Context.Service<object>('test/ImportLifecycle') };
});
vi.mock('../src/ai/service/ai-storage-replacement.service', async () => {
    const Context = await import('effect/Context');

    return { AiStorageReplacementService: Context.Service<object>('test/ImportStorage') };
});
vi.mock('../src/ai/service/ai-embedding-status.service', async () => {
    const Context = await import('effect/Context');

    return { AiEmbeddingStatusService: Context.Service<object>('test/ImportEmbedding') };
});
vi.mock('../src/auth/service/auth.service', async () => {
    const Context = await import('effect/Context');

    return { AuthService: Context.Service<object>('test/ImportAuth') };
});
vi.mock('../src/@generic/drizzle/utils/resolve-backup-file.util', async () => {
    const Effect = await import('effect/Effect');

    return { resolveBackupFile: (uri: string) => Effect.succeed(uri) };
});
vi.mock('../src/@generic/drizzle/utils/open-sqlite-client.util', () => ({ openSqliteClient: vi.fn() }));
vi.mock('../src/@generic/utils/reload-app.util', () => import('./fixture/reload-app-fake'));

vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));
vi.mock('expo-secure-store', () => import('./fixture/expo-secure-store-fake'));

const previous: CloudSyncStateInterface = {
    boundUserRecordName: 'owner',
    stateSerialization: 'token',
    sharedStateSerialization: 'shared',
    resolvedLineageId: 'lineage',
    restorePhase: CloudSyncRestorePhaseEnum.NONE,
    isHouseholdCleanupPending: false,
    householdOwnerDisplayName: null
};

const importLayer = Layer.effect(DatabaseImportService, DatabaseImportService.make).pipe(
    Layer.provide([
        Layer.mock(DatabaseLifecycleService)({ run: (_operation, effect) => effect, close: () => Effect.void }),
        importDependenciesLayer
    ])
);

const importBackup = Effect.exit(Effect.flatMap(DatabaseImportService, service => service.importFromUri('backup', null))).pipe(
    Effect.provide([importLayer, inertDbLayer])
);

const databaseFiles = () => Object.fromEntries([...storage.files].filter(([path]) => path.startsWith('documents/SQLite/')));

describe('database import sync state', () => {
    beforeEach(() => {
        resetStorage();
        secrets.clear();
        storage.files.set('documents/SQLite/budgie.db', 'database');
        storage.files.set('backup', 'backup');
        storage.failCopy = false;
        storage.failMoveFrom = null;
    });
    it.effect.each(['close', 'copy', 'move', 'move-back', 'cleanup', 'success'])(
        'preserves recoverable sync state on %s failure',
        failure =>
            Effect.gen(function* () {
                const isCommitted = failure === 'success' || failure === 'cleanup';
                storage.failCopy = failure === 'copy';
                storage.failMoveFrom = failure === 'move' || failure === 'move-back' ? 'cache/import-temp.db' : null;
                storage.failMoveBackFrom = failure === 'move-back' ? 'documents/SQLite/budgie.db.replaced-0' : null;
                storage.failDelete = failure === 'cleanup' ? 'documents/SQLite/budgie.db.replaced-0' : null;
                secrets.set('user_pin', 'previous-pin');
                const layer = Layer.effect(DatabaseImportService, DatabaseImportService.make).pipe(
                    Layer.provide([
                        Layer.mock(DatabaseLifecycleService)({
                            run: (_operation, effect) => effect,
                            close: () => (failure === 'close' ? Effect.die('close failed') : Effect.void)
                        }),
                        importDependenciesLayer
                    ])
                );
                const query = vi.spyOn(Db, 'query');
                const result = yield* Effect.gen(function* () {
                    const store = yield* CloudSyncStateStore;
                    yield* store.update(previous);

                    return yield* Effect.exit(Effect.flatMap(DatabaseImportService, service => service.importFromUri('backup', 'new-pin')));
                }).pipe(Effect.provide([layer, inertDbLayer, cloudSyncStateStoreLayer]));
                expect(Exit.isFailure(result)).toBe(!isCommitted);
                if (Exit.isFailure(result)) {
                    expect(Cause.squash(result.cause)).toEqual(failure === 'close' ? 'close failed' : expect.any(Error));
                }
                expect(
                    yield* Effect.flatMap(CloudSyncStateStore, store => store.read).pipe(Effect.provide(cloudSyncStateStoreLayer))
                ).toEqual(
                    isCommitted
                        ? {
                              ...previous,
                              stateSerialization: null,
                              resolvedLineageId: null,
                              restorePhase: CloudSyncRestorePhaseEnum.PENDING
                          }
                        : previous
                );
                expect(
                    storage.files.get(failure === 'move-back' ? 'documents/SQLite/budgie.db.replaced-0' : 'documents/SQLite/budgie.db')
                ).toBe(isCommitted ? 'backup' : 'database');
                expect(Object.fromEntries(secrets)).toEqual({
                    user_pin: isCommitted ? 'new-pin' : 'previous-pin',
                    ...(failure === 'move-back' && { database_swap: secrets.get('database_swap') })
                });
                expect(secrets.has('database_swap')).toBe(failure === 'move-back');
                expect(query).not.toHaveBeenCalled();
                query.mockRestore();
            })
    );

    it.effect.each([
        { name: 'restores the live database when the new file cannot be moved in', stale: false, failMoveFrom: 'cache/import-temp.db' },
        {
            name: 'restores the live database when a sidecar cannot be moved aside',
            stale: false,
            failMoveFrom: 'documents/SQLite/budgie.db-wal'
        },
        { name: 'keeps stale moved-aside files when the import fails', stale: true, failMoveFrom: 'cache/import-temp.db' }
    ])('$name', ({ stale, failMoveFrom }) =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db-wal', 'database-wal');
            storage.files.set('backup-wal', 'backup-wal');
            if (stale) {
                storage.files.set('documents/SQLite/budgie.db.replaced', 'stale');
                storage.files.set('documents/SQLite/budgie.db.replaced-shm', 'stale-shm');
            }
            storage.failMoveFrom = failMoveFrom;

            expect(Exit.isFailure(yield* importBackup)).toBe(true);
            expect(databaseFiles()).toEqual({
                'documents/SQLite/budgie.db': 'database',
                'documents/SQLite/budgie.db-wal': 'database-wal',
                ...(stale && { 'documents/SQLite/budgie.db.replaced': 'stale', 'documents/SQLite/budgie.db.replaced-shm': 'stale-shm' })
            });
        })
    );
    it.effect('keeps the original set moved aside and the swap record when its WAL cannot be moved back', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db-wal', 'database-wal');
            storage.failMoveFrom = 'cache/import-temp.db';
            storage.failMoveBackFrom = 'documents/SQLite/budgie.db.replaced-0-wal';

            expect(Exit.isFailure(yield* importBackup)).toBe(true);
            expect(databaseFiles()).toEqual({
                'documents/SQLite/budgie.db.replaced-0': 'database',
                'documents/SQLite/budgie.db.replaced-0-wal': 'database-wal'
            });
            expect(secrets.has('database_swap')).toBe(true);
        })
    );
    it.effect.each([false, true])('replaces the live database, removes its moved-aside files and keeps stale ones %s', stale =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db-wal', 'database-wal');
            storage.files.set('documents/SQLite/budgie.db-shm', 'database-shm');
            storage.files.set('backup-wal', 'backup-wal');
            if (stale) {
                storage.files.set('documents/SQLite/budgie.db.replaced', 'stale');
                storage.files.set('documents/SQLite/budgie.db.replaced-wal', 'stale-wal');
            }

            expect(Exit.isSuccess(yield* importBackup)).toBe(true);
            expect(databaseFiles()).toEqual({
                'documents/SQLite/budgie.db': 'backup',
                'documents/SQLite/budgie.db-wal': 'backup-wal',
                ...(stale && { 'documents/SQLite/budgie.db.replaced': 'stale', 'documents/SQLite/budgie.db.replaced-wal': 'stale-wal' })
            });
        })
    );
});
