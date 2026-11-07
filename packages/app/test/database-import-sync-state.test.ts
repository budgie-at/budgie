import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import { Db } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

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
vi.mock('expo-file-system', () => {
    class Entry {
        readonly uri = 'documents/database';
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
    it.effect('restores prior sync state and PIN when closing the live database fails before replacement', () =>
        Effect.gen(function* () {
            const holder = { state: previous, pin: 'previous-pin' };
            const layer = Layer.effect(DatabaseImportService, DatabaseImportService.make).pipe(
                Layer.provide([
                    Layer.mock(DatabaseLifecycleService)({ run: (_operation, effect) => effect, close: () => Effect.die('close failed') }),
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
                expect(Cause.squash(result.cause)).toBe('close failed');
            }
            expect(holder.state).toEqual(previous);
            expect(holder.pin).toBe('previous-pin');
            expect(query).not.toHaveBeenCalled();
            query.mockRestore();
        })
    );
});
