import { Db, makeEffectSqliteClientDatabase, SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { withReplicas } from 'drizzle-orm/sqlite-core/effect';
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

import { DatabaseExportService } from '../src/export/service/database-export.service';
import { DEFAULT_SETTINGS } from '../src/settings/constants/default-settings.constant';

import type { SettingsEntityInterface } from '@budgie/contracts';

const events = vi.hoisted(() => new Array<string>());
const share = vi.hoisted(() => ({ isFailing: false }));

vi.mock('expo-file-system', () => ({ Directory: vi.fn(), File: vi.fn(), Paths: { cache: '' } }));
vi.mock('react-native-zip-archive', () => ({ zip: () => Promise.resolve('') }));
vi.mock('../src/export/utils/share-cache-file.util', () => ({
    shareCacheFile: () =>
        Effect.suspend(() => {
            events.push('share');

            return share.isFailing ? Effect.die(new Error('Share sheet failed')) : Effect.void;
        })
}));

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

const exportAndShare = Effect.flatMap(DatabaseExportService, service => service.exportAndShare());

describe('DatabaseExportService.exportAndShare', () => {
    beforeEach(() => {
        events.splice(0);
        share.isFailing = false;
    });

    it.effect('checkpoints, shares and then records only lastBackupAt without touching the PIN settings', () =>
        Effect.gen(function* () {
            const settingsRef = yield* Ref.make<SettingsEntityInterface>(DEFAULT_SETTINGS);

            yield* exportAndShare.pipe(Effect.provide(yield* makeExportLayer(settingsRef)));

            expect(events).toEqual(['PRAGMA wal_checkpoint(FULL)', 'share', 'settings:lastBackupAt']);
            const settings = yield* Ref.get(settingsRef);

            expect(settings.lastBackupAt).toBeInstanceOf(Date);
            expect({ ...settings, lastBackupAt: null }).toEqual(DEFAULT_SETTINGS);
        })
    );

    it.effect('writes no setting when the share fails', () =>
        Effect.gen(function* () {
            share.isFailing = true;
            const settingsRef = yield* Ref.make<SettingsEntityInterface>(DEFAULT_SETTINGS);

            const exit = yield* exportAndShare.pipe(Effect.provide(yield* makeExportLayer(settingsRef)), Effect.exit);

            expect(Exit.isFailure(exit)).toBe(true);
            expect(events).toEqual(['PRAGMA wal_checkpoint(FULL)', 'share']);
            expect(yield* Ref.get(settingsRef)).toBe(DEFAULT_SETTINGS);
        })
    );
});
