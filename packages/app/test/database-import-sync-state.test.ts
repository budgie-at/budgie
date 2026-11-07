import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import { Db } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { beforeEach, vi } from 'vitest';

import { DatabaseLifecycleService } from '../src/@generic/drizzle/service/database-lifecycle.service';
import { AiEmbeddingStatusService } from '../src/ai/service/ai-embedding-status.service';
import { AiStorageReplacementService } from '../src/ai/service/ai-storage-replacement.service';
import { AuthService } from '../src/auth/service/auth.service';
import { DatabaseImportService } from '../src/import/service/database-import.service';

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
vi.mock('../src/@generic/utils/reload-app.util', async () => {
    const Effect = await import('effect/Effect');

    return { reloadApp: Effect.void };
});
const storage = vi.hoisted(() => ({ files: new Set<string>(), failCopy: false, failMove: false }));

vi.mock('expo-file-system', () => {
    class Entry {
        readonly uri: string;
        constructor(parent: string | Entry, name?: string) {
            const parentUri = typeof parent === 'string' ? parent : parent.uri;
            this.uri = name ? `${parentUri}/${name}` : parentUri;
        }

        get exists() {
            return storage.files.has(this.uri);
        }

        delete() {
            storage.files.delete(this.uri);
        }

        copy(destination: Entry) {
            if (storage.failCopy) {
                throw new Error('copy failed');
            }
            storage.files.add(destination.uri);

            return Promise.resolve();
        }

        move(destination: Entry, options?: { overwrite?: boolean }) {
            if (storage.failMove) {
                throw new Error('move failed');
            }
            if (destination.exists && options?.overwrite !== true) {
                throw new Error('EEXIST');
            }
            storage.files.delete(this.uri);
            storage.files.add(destination.uri);

            return Promise.resolve();
        }
    }

    return { File: Entry, Directory: Entry, Paths: { document: 'documents', cache: { uri: 'cache' } } };
});

const previous: CloudSyncStateInterface = {
    boundUserRecordName: 'owner',
    stateSerialization: 'token',
    sharedStateSerialization: 'shared',
    resolvedLineageId: 'lineage',
    restorePhase: CloudSyncRestorePhaseEnum.NONE,
    isHouseholdCleanupPending: false,
    householdOwnerDisplayName: null
};

describe('database import sync state', () => {
    beforeEach(() => {
        storage.files.clear();
        storage.files.add('documents/SQLite/budgie.db');
        storage.failCopy = false;
        storage.failMove = false;
    });
    it.effect.each(['close', 'copy', 'move'])('preserves recoverable sync state on %s failure', failure =>
        Effect.gen(function* () {
            storage.failCopy = failure === 'copy';
            storage.failMove = failure === 'move';
            const holder = { state: previous, pin: 'previous-pin' };
            const layer = Layer.effect(DatabaseImportService, DatabaseImportService.make).pipe(
                Layer.provide([
                    Layer.mock(DatabaseLifecycleService)({
                        run: (_operation, effect) => effect,
                        close: () => (failure === 'close' ? Effect.die('close failed') : Effect.void)
                    }),
                    Layer.mock(AiStorageReplacementService)({ pauseLongLivedRuntime: () => Effect.void }),
                    Layer.mock(AiEmbeddingStatusService)({ forgetModel: Effect.void }),
                    Layer.mock(AuthService)({
                        getPin: () => Effect.succeed(holder.pin),
                        persistPin: pin =>
                            Effect.sync(() => {
                                holder.pin = pin ?? '';
                            })
                    }),
                    Layer.succeed(CloudSyncStateStore, {
                        read: Effect.sync(() => holder.state),
                        clear: Effect.die('must not clear sync state'),
                        update: patch =>
                            Effect.sync(() => {
                                holder.state = { ...holder.state, ...patch };
                            })
                    })
                ])
            );
            const query = vi.spyOn(Db, 'query');
            const result = yield* Effect.flatMap(DatabaseImportService, service => service.importFromUri('backup', 'new-pin')).pipe(
                Effect.provide([layer, inertDbLayer]),
                Effect.exit
            );
            expect(Exit.isFailure(result)).toBe(true);
            if (Exit.isFailure(result)) {
                expect(Cause.squash(result.cause)).toEqual(failure === 'close' ? 'close failed' : expect.any(Error));
            }
            expect(holder.state).toEqual(
                failure === 'move'
                    ? { ...previous, stateSerialization: null, resolvedLineageId: null, restorePhase: CloudSyncRestorePhaseEnum.PENDING }
                    : previous
            );
            expect(storage.files.has('documents/SQLite/budgie.db')).toBe(failure !== 'move');
            expect(holder.pin).toBe(failure === 'move' ? 'new-pin' : 'previous-pin');
            expect(query).not.toHaveBeenCalled();
            query.mockRestore();
        })
    );
});
