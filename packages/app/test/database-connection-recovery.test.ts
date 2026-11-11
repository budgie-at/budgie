import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { beforeEach, vi } from 'vitest';

import { DatabaseChangeService } from '../src/@generic/drizzle/service/database-change.service';
import { DatabaseConnectionService } from '../src/@generic/drizzle/service/database-connection.service';
import { openSqliteClient } from '../src/@generic/drizzle/utils/open-sqlite-client.util';

import { resetStorage, storage } from './fixture/expo-file-system-fake';

vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));
vi.mock('@effect/sql-sqlite-react-native/SqliteClient', () => ({ withAsyncQuery: identity }));
vi.mock('../src/@generic/drizzle/utils/read-database-key.util', () => ({ readDatabaseKey: Effect.succeed(null) }));
vi.mock('../src/@generic/drizzle/utils/open-sqlite-client.util', async () => {
    const { inertSqlClient } = await import('./fixture/inert-sql-client');

    return { openSqliteClient: vi.fn(() => inertSqlClient) };
});

const startup = DatabaseConnectionService.make.pipe(
    Effect.provide(DatabaseChangeService.layer.pipe(Layer.provideMerge(Reactivity.layer))),
    Effect.scoped
);

describe('connection startup recovery', () => {
    beforeEach(() => {
        resetStorage();
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

    it.effect('leaves the moved-aside database in place while an interrupted rekey backup exists', () =>
        Effect.gen(function* () {
            storage.files.set('documents/SQLite/budgie.db.bak', 'rekey-backup');
            storage.files.set('documents/SQLite/budgie.db.replaced-1700000000000', 'original');

            yield* startup;

            expect(storage.files.has('documents/SQLite/budgie.db')).toBe(false);
            expect(storage.files.get('documents/SQLite/budgie.db.bak')).toBe('rekey-backup');
            expect(storage.files.get('documents/SQLite/budgie.db.replaced-1700000000000')).toBe('original');
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
