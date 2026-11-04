import { Db, makeEffectSqliteClientDatabase, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import { identity } from 'effect/Function';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import * as Ref from 'effect/Ref';
import * as SqlClient from 'effect/sql/SqlClient';
import * as SqlConnection from 'effect/sql/SqlConnection';
import * as Statement from 'effect/sql/Statement';
import * as Stream from 'effect/Stream';
import { beforeEach, vi } from 'vitest';

import { isString } from '@rnw-community/shared';

import { DatabaseExportService } from '../src/export/service/database-export.service';
import { DEFAULT_SETTINGS } from '../src/settings/constants/default-settings.constant';

import type { SettingsEntityInterface } from '@budgie/contracts';
import type { Directory, File } from 'expo-file-system';
import type { SharingOptions } from 'expo-sharing';

const events = vi.hoisted(() => new Array<string>());
const native = vi.hoisted(() => ({
    picker: vi.fn<() => Promise<Pick<Directory, 'uri'>>>(),
    copy: vi.fn<(destination: string) => Promise<void>>(),
    zip: vi.fn<(paths: string[], destination: string) => Promise<string>>(),
    share: vi.fn<(uri: string, options?: SharingOptions) => Promise<void>>()
}));

vi.mock('expo-file-system', () => {
    class FileSystemEntryMock {
        static readonly pickDirectoryAsync = native.picker;
        readonly uri: string;
        readonly name: string;
        readonly exists = true;

        constructor(parent: string | Pick<File, 'uri'>, name: string) {
            this.uri = `${isString(parent) ? parent : parent.uri}/${name}`;
            this.name = name;
        }

        copy(destination: Pick<File, 'uri'>) {
            return native.copy(destination.uri);
        }

        delete() {
            events.push('cleanup');
        }
    }

    return { Directory: FileSystemEntryMock, File: FileSystemEntryMock, Paths: { cache: 'file:///cache', document: 'file:///documents' } };
});
vi.mock('react-native-zip-archive', () => ({ zip: native.zip }));
vi.mock('expo-sharing', () => ({ isAvailableAsync: () => Promise.resolve(true), shareAsync: native.share }));

const recordStatement = (sql: string) => Effect.sync(() => void events.push(sql)).pipe(Effect.as([]));

const recordingConnection: SqlConnection.Connection = {
    execute: recordStatement,
    executeRaw: recordStatement,
    executeStream: () => Stream.empty,
    executeValues: recordStatement,
    executeValuesUnprepared: recordStatement,
    executeUnprepared: recordStatement
};

const makeExportLayer = Effect.fnUntraced(function* (settingsRef: Ref.Ref<SettingsEntityInterface>) {
    const client = yield* SqlClient.make({
        acquirer: Effect.succeed(recordingConnection),
        compiler: Statement.makeCompilerSqlite(),
        driver: 'recording',
        spanAttributes: []
    }).pipe(Effect.provide(Reactivity.layer));

    const database = yield* makeEffectSqliteClientDatabase(client, { runQuery: identity });

    return Layer.effect(DatabaseExportService, DatabaseExportService.make).pipe(
        Layer.provide(
            Layer.mock(SettingsRepository)({
                update: input =>
                    Effect.sync(() => void events.push(`settings:${Object.keys(input).join(',')}`)).pipe(
                        Effect.andThen(Ref.updateAndGet(settingsRef, settings => ({ ...settings, ...input })))
                    )
            })
        ),
        Layer.provideMerge(Layer.succeed(Db, withReplicas(database, [database])))
    );
});

const saveBackup = Effect.flatMap(DatabaseExportService, service => service.saveBackup());

const previousSettings = { ...DEFAULT_SETTINGS, lastBackupAt: new Date('2025-01-01T00:00:00Z') };

const expectFailedBackup = Effect.fnUntraced(function* (failure: Error) {
    const settingsRef = yield* Ref.make<SettingsEntityInterface>(previousSettings);
    const exit = yield* saveBackup.pipe(Effect.provide(yield* makeExportLayer(settingsRef)), Effect.exit);

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
        expect(Cause.squash(exit.cause)).toBe(failure);
    }
    expect(yield* Ref.get(settingsRef)).toBe(previousSettings);
});

describe('DatabaseExportService', () => {
    beforeEach(() => {
        events.splice(0);
        native.picker.mockReset().mockImplementation(() => {
            events.push('picker');

            return Promise.resolve({ uri: 'file:///chosen' });
        });
        native.copy.mockReset().mockImplementation((destination: string) => {
            events.push(destination.includes('/cache/') ? 'snapshot' : 'saved');

            return Promise.resolve();
        });
        native.zip.mockReset().mockImplementation(() => {
            events.push('zip');

            return Promise.resolve('archive');
        });
        native.share.mockReset().mockResolvedValue(undefined);
    });

    it.effect.each(['file:///chosen', 'content://documents/tree/primary%3ABackups'])(
        'records the backup date only after copying the zip to %s',
        directoryUri =>
            Effect.gen(function* () {
                native.picker.mockResolvedValue({ uri: directoryUri });
                const settingsRef = yield* Ref.make<SettingsEntityInterface>(previousSettings);

                expect(yield* saveBackup.pipe(Effect.provide(yield* makeExportLayer(settingsRef)))).toBe(true);
                expect(native.copy).toHaveBeenLastCalledWith(directoryUri);
                expect(events).toEqual([
                    'PRAGMA wal_checkpoint(FULL)',
                    'snapshot',
                    'zip',
                    'cleanup',
                    'saved',
                    'cleanup',
                    'settings:lastBackupAt'
                ]);

                const settings = yield* Ref.get(settingsRef);

                expect(settings.lastBackupAt).toBeInstanceOf(Date);
                expect({ ...settings, lastBackupAt: previousSettings.lastBackupAt }).toEqual(previousSettings);
                expect(settings.lastBackupAt).not.toEqual(previousSettings.lastBackupAt);
                expect(native.share).not.toHaveBeenCalled();
            })
    );

    it.effect.each(['ERR_FILE_PICKING_CANCELLED', 'ERR_PICKER_CANCELLED'])(
        'returns cancellation without changing the previous date for %s',
        code =>
            Effect.gen(function* () {
                native.picker.mockRejectedValue(Object.assign(new Error('Picker cancelled'), { code }));
                const settingsRef = yield* Ref.make<SettingsEntityInterface>(previousSettings);

                expect(yield* saveBackup.pipe(Effect.provide(yield* makeExportLayer(settingsRef)))).toBe(false);
                expect(yield* Ref.get(settingsRef)).toBe(previousSettings);
                expect(events).toEqual([]);
                expect(native.copy).not.toHaveBeenCalled();
                expect(native.share).not.toHaveBeenCalled();
            })
    );

    it.effect('propagates a failed destination write without updating the date and cleans the cache', () =>
        Effect.gen(function* () {
            const failure = new Error('Destination write failed');
            native.copy.mockImplementation((destination: string) =>
                destination.includes('/cache/') ? Promise.resolve() : Promise.reject(failure)
            );
            yield* expectFailedBackup(failure);
            expect(events.filter(event => event === 'cleanup')).toHaveLength(2);
            expect(native.share).not.toHaveBeenCalled();
        })
    );

    it.effect('propagates picker errors other than cancellation', () =>
        Effect.gen(function* () {
            const failure = new Error('Picker unavailable');
            native.picker.mockRejectedValue(failure);
            yield* expectFailedBackup(failure);
            expect(native.copy).not.toHaveBeenCalled();
        })
    );

    it.effect.each(['copy', 'zip'])('cleans cache files and preserves the backup date when archive %s fails', operation =>
        Effect.gen(function* () {
            const failure = new Error('Archive failed');
            native[operation === 'copy' ? 'copy' : 'zip'].mockRejectedValue(failure);
            yield* expectFailedBackup(failure);
            expect(events.filter(event => event === 'cleanup')).toHaveLength(2);
        })
    );

    it.effect('shares a copy without updating the previous backup date', () =>
        Effect.gen(function* () {
            const settingsRef = yield* Ref.make<SettingsEntityInterface>(previousSettings);

            yield* Effect.flatMap(DatabaseExportService, service => service.exportAndShare()).pipe(
                Effect.provide(yield* makeExportLayer(settingsRef))
            );

            expect(native.share).toHaveBeenCalledWith(
                expect.stringContaining('budgie-backup-'),
                expect.objectContaining({ mimeType: 'application/zip' })
            );
            expect(native.picker).not.toHaveBeenCalled();
            expect(yield* Ref.get(settingsRef)).toBe(previousSettings);
        })
    );
});
