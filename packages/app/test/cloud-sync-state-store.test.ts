import { CloudSyncRestorePhaseEnum, CloudSyncStateStore } from '@budgie/cloud-sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { beforeEach, vi } from 'vitest';

import { cloudSyncStateStoreLayer } from '../src/cloud-sync/layer/cloud-sync-state-store.layer';

const storage = vi.hoisted(() => ({
    files: new Map<string, string>(),
    failWrite: false,
    crashAfterRemove: false,
    events: new Array<string>()
}));

vi.mock('expo-file-system', () => {
    class FileMock {
        readonly uri: string;
        constructor(parent: string, name: string) {
            this.uri = `${parent}/${name}`;
        }

        get exists() {
            return storage.files.has(this.uri);
        }

        create() {
            storage.files.set(this.uri, '');
        }

        writeSync(value: string) {
            storage.events.push('write');
            if (storage.failWrite) {
                throw new Error('Disk full');
            }
            storage.files.set(this.uri, value);
        }

        textSync() {
            return storage.files.get(this.uri) ?? '';
        }

        move(destination: FileMock, options?: { overwrite?: boolean }) {
            this.moveSync(destination, options);

            return Promise.resolve();
        }

        moveSync(destination: FileMock, options?: { overwrite?: boolean }) {
            if (destination.exists && options?.overwrite !== true) {
                throw new Error('EEXIST');
            }
            storage.files.delete(destination.uri);
            if (storage.crashAfterRemove) {
                throw new Error('crash');
            }
            storage.events.push('move');
            storage.files.set(destination.uri, this.textSync());
            storage.files.delete(this.uri);
        }

        delete() {
            storage.files.delete(this.uri);
        }
    }

    return { File: FileMock, Paths: { document: 'documents' } };
});

vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));

const path = 'documents/cloud-sync-state.json';
const state = {
    boundUserRecordName: 'owner',
    stateSerialization: 'private-token',
    sharedStateSerialization: 'shared-token',
    resolvedLineageId: 'lineage',
    restorePhase: CloudSyncRestorePhaseEnum.PENDING,
    isHouseholdCleanupPending: true,
    householdOwnerDisplayName: 'Owner'
};

const encodedState = JSON.stringify(state);

describe('cloud sync state file', () => {
    beforeEach(() => {
        storage.files.clear();
        storage.events.splice(0);
        storage.failWrite = false;
        storage.crashAfterRemove = false;
    });
    it.effect('writes the complete temporary file before replacing committed state', () =>
        Effect.gen(function* () {
            const store = yield* CloudSyncStateStore;
            storage.files.set(path, encodedState);
            yield* store.update({ stateSerialization: 'next' });
            expect(storage.events).toEqual(['write', 'move']);
            expect(yield* store.read).toEqual({ ...state, stateSerialization: 'next' });
            expect(storage.files.has(`${path}.tmp`)).toBe(false);
        }).pipe(Effect.provide(cloudSyncStateStoreLayer))
    );
    it.effect('reads the second consecutive update', () =>
        Effect.gen(function* () {
            const store = yield* CloudSyncStateStore;
            yield* store.update(state);
            yield* store.update({ stateSerialization: 'second' });
            expect(yield* store.read).toEqual({ ...state, stateSerialization: 'second' });
        }).pipe(Effect.provide(cloudSyncStateStoreLayer))
    );
    it.effect('promotes a complete temporary state after interrupted replacement', () =>
        Effect.gen(function* () {
            const store = yield* CloudSyncStateStore;
            storage.files.set(path, encodedState);
            storage.crashAfterRemove = true;
            expect(Exit.isFailure(yield* Effect.exit(store.update({ stateSerialization: 'recovered' })))).toBe(true);
            storage.crashAfterRemove = false;
            expect(
                yield* Effect.flatMap(CloudSyncStateStore, freshStore => freshStore.read).pipe(Effect.provide(cloudSyncStateStoreLayer))
            ).toEqual({ ...state, stateSerialization: 'recovered' });
            expect(storage.files.has(path)).toBe(true);
            expect(storage.files.has(`${path}.tmp`)).toBe(false);
        }).pipe(Effect.provide(cloudSyncStateStoreLayer))
    );
    it.effect('prefers committed state over a partial temporary file and clears both', () =>
        Effect.gen(function* () {
            const store = yield* CloudSyncStateStore;
            storage.files.set(path, encodedState);
            storage.files.set(`${path}.tmp`, '{broken');
            expect(yield* store.read).toEqual(state);
            yield* store.clear;
            expect(storage.files.size).toBe(0);
        }).pipe(Effect.provide(cloudSyncStateStoreLayer))
    );
    it.effect('keeps committed state when writing the temporary file fails', () =>
        Effect.gen(function* () {
            const store = yield* CloudSyncStateStore;
            storage.files.set(path, encodedState);
            storage.failWrite = true;
            expect(Exit.isFailure(yield* Effect.exit(store.update({ stateSerialization: 'lost' })))).toBe(true);
            expect(yield* store.read).toEqual(state);
            expect(storage.events).toEqual(['write']);
        }).pipe(Effect.provide(cloudSyncStateStoreLayer))
    );
    it.effect.each(['{broken', JSON.stringify({ stateSerialization: 'legacy' })])('ignores corrupt or incomplete state: %s', contents =>
        Effect.gen(function* () {
            const store = yield* CloudSyncStateStore;
            storage.files.set(path, contents);
            expect(yield* store.read).toEqual({
                boundUserRecordName: null,
                stateSerialization: null,
                sharedStateSerialization: null,
                resolvedLineageId: null,
                restorePhase: CloudSyncRestorePhaseEnum.NONE,
                isHouseholdCleanupPending: false,
                householdOwnerDisplayName: null
            });
        }).pipe(Effect.provide(cloudSyncStateStoreLayer))
    );
});
