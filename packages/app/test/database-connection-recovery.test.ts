import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import { SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { beforeEach, vi } from 'vitest';

import { DatabaseChangeService } from '../src/@generic/drizzle/service/database-change.service';
import { DatabaseConnectionService } from '../src/@generic/drizzle/service/database-connection.service';
import { DatabaseLifecycleService } from '../src/@generic/drizzle/service/database-lifecycle.service';
import { DatabaseRekeyService } from '../src/@generic/drizzle/service/database-rekey.service';
import { DatabaseSwapService } from '../src/@generic/drizzle/service/database-swap.service';
import { openSqliteClient } from '../src/@generic/drizzle/utils/open-sqlite-client.util';
import { DatabaseImportService } from '../src/import/service/database-import.service';

import { resetStorage, storage } from './fixture/expo-file-system-fake';
import { secrets } from './fixture/expo-secure-store-fake';
import { importDependenciesLayer } from './fixture/import-dependencies-layer';
import { inertDbLayer } from './fixture/inert-db-layer';

import type { CloudSyncStateInterface } from '@budgie/cloud-sync';

const closeWrites = vi.hoisted(() => new Map<string, string>());

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('expo-secure-store', () => import('./fixture/expo-secure-store-fake'));
vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));
vi.mock('@effect/sql-sqlite-react-native/SqliteClient', async () => ({ withAsyncQuery: (await import('effect/Function')).identity }));
vi.mock('../src/@generic/utils/reload-app.util', () => import('./fixture/reload-app-fake'));
vi.mock('../src/@generic/drizzle/utils/resolve-backup-file.util', async () => {
    const Effect = await import('effect/Effect');

    return { resolveBackupFile: (uri: string) => Effect.succeed(uri) };
});
vi.mock('../src/@generic/drizzle/service/database-lifecycle.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseLifecycleService: Context.Service<object>('test/SwapLifecycle') };
});
vi.mock('../src/ai/service/ai-storage-replacement.service', async () => {
    const Context = await import('effect/Context');

    return { AiStorageReplacementService: Context.Service<object>('test/SwapStorage') };
});
vi.mock('../src/ai/service/ai-embedding-status.service', async () => {
    const Context = await import('effect/Context');

    return { AiEmbeddingStatusService: Context.Service<object>('test/SwapEmbedding') };
});
vi.mock('../src/auth/service/auth.service', async () => {
    const Context = await import('effect/Context');

    return { AuthService: Context.Service<object>('test/SwapAuth') };
});
vi.mock('../src/@generic/drizzle/utils/open-sqlite-client.util', async () => {
    const Effect = await import('effect/Effect');
    const { inertSqlClient } = await import('./fixture/inert-sql-client');
    const { storage: files } = await import('./fixture/expo-file-system-fake');
    const { DatabaseOpenError } = await import('../src/@generic/drizzle/error/database-open.error');

    return {
        openSqliteClient: vi.fn((filename: string, key: string | null) =>
            (files.files.get(`documents/SQLite/${filename}`)?.split('@').at(1) ?? null) === key
                ? inertSqlClient
                : Effect.fail(DatabaseOpenError.make({ cause: 'wrong key' }))
        )
    };
});

const previousState: CloudSyncStateInterface = {
    boundUserRecordName: 'owner',
    stateSerialization: 'token',
    sharedStateSerialization: 'shared',
    resolvedLineageId: 'lineage',
    restorePhase: CloudSyncRestorePhaseEnum.NONE,
    isHouseholdCleanupPending: false,
    householdOwnerDisplayName: null
};
const importedState: CloudSyncStateInterface = {
    ...previousState,
    stateSerialization: null,
    resolvedLineageId: null,
    restorePhase: CloudSyncRestorePhaseEnum.PENDING
};
const killed = { files: new Map<string, string>(), secrets: new Map<string, string>() };

const copyInto = (target: Map<string, string>, source: ReadonlyMap<string, string>) => {
    target.clear();
    source.forEach((value, key) => target.set(key, value));
};
const takeSnapshot = () => {
    copyInto(killed.files, storage.files);
    copyInto(killed.secrets, secrets);
};
const restartAfterKill = Effect.sync(() => {
    storage.beforeTransfer = () => void 0;
    copyInto(storage.files, killed.files);
    copyInto(secrets, killed.secrets);
});
const killBeforeTransferring = (sourceUri: string, run: Effect.Effect<unknown>) =>
    Effect.sync(() => {
        storage.beforeTransfer = uri => {
            if (uri === sourceUri) {
                takeSnapshot();
            }
        };
    }).pipe(Effect.andThen(run), Effect.andThen(restartAfterKill));

const servicesLayer = Layer.mergeAll(
    Layer.effect(DatabaseImportService, DatabaseImportService.make),
    Layer.effect(DatabaseRekeyService, DatabaseRekeyService.make)
).pipe(
    Layer.provide([
        Layer.mock(DatabaseLifecycleService)({
            run: (_operation, effect) => effect,
            close: () => Effect.sync(() => void closeWrites.forEach((contents, uri) => storage.files.set(uri, contents)))
        }),
        Layer.mock(SettingsRepository)({}),
        importDependenciesLayer,
        Reactivity.layer
    ]),
    Layer.provideMerge(inertDbLayer)
);

const importBackup = (backupPin: string) =>
    Effect.exit(Effect.flatMap(DatabaseImportService, service => service.importFromUri('backup', backupPin))).pipe(
        Effect.provide(servicesLayer)
    );
const changePin = (onCommit: Effect.Effect<void>) =>
    Effect.sync(() => closeWrites.set('documents/SQLite/auth-migration.db', 'rekeyed@new-pin')).pipe(
        Effect.andThen(Effect.flatMap(DatabaseRekeyService, service => service.rekey({ nextKey: 'new-pin' }, onCommit))),
        Effect.exit,
        Effect.provide(servicesLayer)
    );
const storePin = Effect.sync(() => void secrets.set('user_pin', 'new-pin'));
const killBeforeStoringPin = changePin(Effect.sync(takeSnapshot).pipe(Effect.andThen(storePin))).pipe(Effect.andThen(restartAfterKill));
const boot = Effect.exit(
    Effect.flatMap(DatabaseConnectionService, () => Effect.void).pipe(
        Effect.provide(DatabaseConnectionService.layer.pipe(Layer.provide(Reactivity.layer)))
    )
);
const readSyncState = Effect.flatMap(CloudSyncStateStore, store => store.read).pipe(Effect.provide(importDependenciesLayer));
const databaseFiles = () => Object.fromEntries([...storage.files].filter(([path]) => path.startsWith('documents/SQLite/')));
const expectBoot = (files: Record<string, string>, pin: string) =>
    Effect.gen(function* () {
        expect(Exit.isSuccess(yield* boot)).toBe(true);
        expect(databaseFiles()).toEqual(files);
        expect(Object.fromEntries(secrets)).toEqual({ user_pin: pin });
    });

const startup = DatabaseConnectionService.make.pipe(
    Effect.provide(Layer.mergeAll(DatabaseChangeService.layer, DatabaseSwapService.layer).pipe(Layer.provideMerge(Reactivity.layer))),
    Effect.scoped
);

describe('connection startup recovery', () => {
    beforeEach(() => {
        resetStorage();
        secrets.clear();
        vi.mocked(openSqliteClient).mockClear();
    });

    it.effect('opens an intact database when a stale restore marker cannot be deleted', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db', 'intact');
            storage.files.set('documents/SQLite/pre-restore.db', 'older');
            storage.files.set('documents/SQLite/pre-restore.pending', '');
            storage.failDelete = 'documents/SQLite/pre-restore.pending';

            yield* startup;

            expect(openSqliteClient).toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('intact');
            expect(storage.files.has('documents/SQLite/pre-restore.pending')).toBe(true);
        })
    );

    it.effect.each(['recovering', 'wal', 'shm', 'copy', 'move'])('blocks SQLite open after failed %s and retries', failure =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/pre-restore.db', 'original');
            storage.files.set('documents/SQLite/pre-restore.pending', '');
            storage.files.set('documents/SQLite/pre-restore.db.recovering', 'partial');
            storage.files.set('documents/SQLite/budgie.db-wal', 'wal');
            storage.files.set('documents/SQLite/budgie.db-shm', 'shm');
            storage.failDelete = failure === 'recovering' ? 'documents/SQLite/pre-restore.db.recovering' : null;
            if (failure === 'wal' || failure === 'shm') {
                storage.failDelete = `documents/SQLite/budgie.db-${failure}`;
            }
            storage.failCopy = failure === 'copy';
            storage.failMoveFrom = failure === 'move' ? 'documents/SQLite/pre-restore.db.recovering' : null;
            const error = yield* Effect.flip(startup);
            expect(error._tag).toBe('DatabaseOpenError');
            expect(openSqliteClient).not.toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/pre-restore.db')).toBe('original');
            expect(storage.files.has('documents/SQLite/pre-restore.pending')).toBe(true);
            expect(storage.files.has('documents/SQLite/budgie.db')).toBe(false);
            storage.failDelete = null;
            storage.failCopy = false;
            storage.failMoveFrom = null;
            yield* startup;
            expect(openSqliteClient).toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('original');
            expect(storage.files.get('documents/SQLite/pre-restore.db')).toBe('original');
            expect(storage.files.has('documents/SQLite/pre-restore.pending')).toBe(false);
        })
    );

    it.effect('restores a database moved aside by an interrupted import when no live database exists', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000', 'original');
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000-wal', 'original-wal');

            yield* startup;

            expect(openSqliteClient).toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('original');
            expect(storage.files.get('documents/SQLite/budgie.db-wal')).toBe('original-wal');
            expect([...storage.files.keys()].filter(uri => uri.includes('.replaced-'))).toEqual([]);
        })
    );

    it.effect('restores only the newest moved-aside database', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db.replaced-900000000000', 'older');
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000', 'newest');
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000-shm', 'newest-shm');

            yield* startup;

            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('newest');
            expect(storage.files.get('documents/SQLite/budgie.db-shm')).toBe('newest-shm');
            expect(storage.files.get('documents/SQLite/budgie.db.replaced-900000000000')).toBe('older');
            expect(storage.files.has('documents/SQLite/budgie.db.replaced-1700000000000')).toBe(false);
        })
    );

    it.effect('keeps a live database and leaves the moved-aside database in place', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db', 'live');
            storage.files.set('documents/SQLite/budgie.db-wal', 'live-wal');
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000', 'original');
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000-wal', 'original-wal');

            yield* startup;

            expect(openSqliteClient).toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('live');
            expect(storage.files.get('documents/SQLite/budgie.db-wal')).toBe('live-wal');
            expect(storage.files.get('documents/SQLite/budgie.db.replaced-1700000000000')).toBe('original');
            expect(storage.files.get('documents/SQLite/budgie.db.replaced-1700000000000-wal')).toBe('original-wal');
        })
    );

    it.effect('restores the database left in the rekey backup when no live database exists', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db.bak', 'rekey-backup');

            yield* startup;

            expect(openSqliteClient).toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('rekey-backup');
            expect(storage.files.has('documents/SQLite/budgie.db.bak')).toBe(false);
        })
    );

    it.effect('keeps a live database and leaves the rekey backup in place', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db', 'live');
            storage.files.set('documents/SQLite/budgie.db.bak', 'rekey-backup');

            yield* startup;

            expect(openSqliteClient).toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('live');
            expect(storage.files.get('documents/SQLite/budgie.db.bak')).toBe('rekey-backup');
        })
    );

    it.effect('restores the rekey backup and leaves the moved-aside database in place', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db.bak', 'rekey-backup');
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000', 'original');

            yield* startup;

            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('rekey-backup');
            expect(storage.files.has('documents/SQLite/budgie.db.bak')).toBe(false);
            expect(storage.files.get('documents/SQLite/budgie.db.replaced-1700000000000')).toBe('original');
        })
    );

    it.effect('blocks SQLite open when the rekey backup cannot be restored and retries', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db.bak', 'rekey-backup');
            storage.failMoveFrom = 'documents/SQLite/budgie.db.bak';

            const error = yield* Effect.flip(startup);

            expect(error._tag).toBe('DatabaseOpenError');
            expect(openSqliteClient).not.toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db.bak')).toBe('rekey-backup');
            storage.failMoveFrom = null;
            yield* startup;
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('rekey-backup');
        })
    );

    it.effect('blocks SQLite open when the moved-aside database cannot be restored and retries', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000', 'original');
            storage.failMoveFrom = 'documents/SQLite/budgie.db.replaced-1700000000000';

            const error = yield* Effect.flip(startup);

            expect(error._tag).toBe('DatabaseOpenError');
            expect(openSqliteClient).not.toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db.replaced-1700000000000')).toBe('original');
            expect(storage.files.has('documents/SQLite/budgie.db')).toBe(false);
            storage.failMoveFrom = null;
            yield* startup;
            expect(openSqliteClient).toHaveBeenCalled();
            expect(storage.files.get('documents/SQLite/budgie.db')).toBe('original');
            expect(storage.files.has('documents/SQLite/budgie.db.replaced-1700000000000')).toBe(false);
        })
    );
});

describe('database swap recovery after a kill', () => {
    beforeEach(() => {
        resetStorage();
        secrets.clear();
        closeWrites.clear();
        secrets.set('user_pin', 'old-pin');
        storage.files.set('documents/SQLite/budgie.db', 'original@old-pin');
        storage.files.set('backup', 'imported@backup-pin');
        storage.files.set('backup-wal', 'imported-wal');
        storage.files.set('documents/cloud-sync-state.json', JSON.stringify(previousState));
    });

    it.effect('restores the original database, PIN and sync state when an import is killed after the move-aside', () =>
        Effect.gen(function* () {
            yield* killBeforeTransferring('cache/import-temp.db', importBackup('backup-pin'));

            yield* expectBoot({ 'documents/SQLite/budgie.db': 'original@old-pin' }, 'old-pin');
            expect(yield* readSyncState).toEqual(previousState);
        })
    );

    it.effect('keeps the moved-aside database when a cloud restore is killed after the move-aside', () =>
        Effect.gen(function* () {
            storage.files.set('backup', 'imported@old-pin');
            storage.files.set('documents/SQLite/pre-restore.db', 'original@old-pin');
            storage.files.set('documents/SQLite/pre-restore.pending', '');
            yield* killBeforeTransferring('cache/import-temp.db', importBackup('old-pin'));

            yield* expectBoot(
                {
                    'documents/SQLite/budgie.db': 'original@old-pin',
                    'documents/SQLite/budgie.db.replaced-0': 'original@old-pin',
                    'documents/SQLite/pre-restore.db': 'original@old-pin'
                },
                'old-pin'
            );
            expect(yield* readSyncState).toEqual(previousState);
        })
    );

    it.effect('finishes an import killed after the new database was moved in', () =>
        Effect.gen(function* () {
            yield* killBeforeTransferring('backup-wal', importBackup('backup-pin'));

            yield* expectBoot({ 'documents/SQLite/budgie.db': 'imported@backup-pin' }, 'backup-pin');
            expect(yield* readSyncState).toEqual(importedState);
        })
    );

    it.effect('keeps the old PIN when a PIN change is killed between the two moves', () =>
        Effect.gen(function* () {
            yield* killBeforeTransferring('documents/SQLite/auth-migration.db', changePin(storePin));

            yield* expectBoot(
                { 'documents/SQLite/budgie.db': 'original@old-pin', 'documents/SQLite/auth-migration.db': 'rekeyed@new-pin' },
                'old-pin'
            );
        })
    );

    it.effect('promotes the new PIN when a PIN change is killed after the new database is in place', () =>
        Effect.gen(function* () {
            yield* killBeforeStoringPin;

            yield* expectBoot({ 'documents/SQLite/budgie.db': 'rekeyed@new-pin' }, 'new-pin');
        })
    );

    it.effect('opens with the stored PIN and keeps a stale rekey backup when the PIN change never moved a file', () =>
        Effect.gen(function* () {
            yield* killBeforeTransferring('documents/SQLite/budgie.db', changePin(storePin));
            storage.files.set('documents/SQLite/budgie.db.bak', 'stale@older-pin');

            yield* expectBoot(
                {
                    'documents/SQLite/budgie.db': 'original@old-pin',
                    'documents/SQLite/budgie.db.bak': 'stale@older-pin',
                    'documents/SQLite/auth-migration.db': 'rekeyed@new-pin'
                },
                'old-pin'
            );
        })
    );

    it.effect('restores the old PIN with the old database when a committed PIN change rolls back', () =>
        Effect.gen(function* () {
            expect(Exit.isFailure(yield* changePin(storePin.pipe(Effect.andThen(Effect.die('after commit')))))).toBe(true);

            yield* expectBoot({ 'documents/SQLite/budgie.db': 'original@old-pin' }, 'old-pin');
        })
    );

    it.effect('leaves files and keys untouched when no key opens the live database', () =>
        Effect.gen(function* () {
            yield* killBeforeStoringPin;
            storage.files.set('documents/SQLite/budgie.db', 'rekeyed@unknown-pin');
            const filesBefore = databaseFiles();
            const secretsBefore = Object.fromEntries(secrets);

            expect(Exit.isFailure(yield* boot)).toBe(true);
            expect(databaseFiles()).toEqual(filesBefore);
            expect(Object.fromEntries(secrets)).toEqual(secretsBefore);
        })
    );

    it.effect('leaves only the PIN behind after a successful import and PIN change', () =>
        Effect.gen(function* () {
            expect(Exit.isSuccess(yield* importBackup('backup-pin'))).toBe(true);
            expect(Object.fromEntries(secrets)).toEqual({ user_pin: 'backup-pin' });
            expect(yield* readSyncState).toEqual(importedState);

            storage.files.set('documents/SQLite/budgie.db', 'imported@old-pin');
            secrets.set('user_pin', 'old-pin');
            expect(Exit.isSuccess(yield* changePin(storePin))).toBe(true);
            expect(databaseFiles()).toEqual({ 'documents/SQLite/budgie.db': 'rekeyed@new-pin' });
            expect(Object.fromEntries(secrets)).toEqual({ user_pin: 'new-pin' });
        })
    );
});
