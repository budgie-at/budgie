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
});
