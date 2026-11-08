import { SettingsRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Cause from 'effect/Cause';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import * as Reactivity from 'effect/reactivity/Reactivity';
import { vi } from 'vitest';

import { DatabaseRekeyService } from '../src/@generic/drizzle/service/database-rekey.service';
import { CloudRestoreService } from '../src/cloud-backup/service/cloud-restore.service';
import { CloudTransport } from '../src/cloud-backup/service/cloud-transport.service';
import { DatabaseImportService } from '../src/import/service/database-import.service';
import { DEFAULT_SETTINGS } from '../src/settings/constants/default-settings.constant';

import { storage } from './fixture/expo-file-system-fake';
import { inertDbLayer } from './fixture/inert-db-layer';

const operations = vi.hoisted(() => new Array<string>());
vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('../src/@generic/drizzle/service/database-rekey.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseRekeyService: Context.Service<object>('test/RestoreRekey') };
});
vi.mock('../src/import/service/database-import.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseImportService: Context.Service<object>('test/RestoreImport') };
});
vi.mock('../src/cloud-backup/service/cloud-transport.service', async () => {
    const Context = await import('effect/Context');

    return { CloudTransport: Context.Service<object>('test/RestoreTransport') };
});
vi.mock('../src/@generic/drizzle/utils/read-database-key.util', async () => {
    const Effect = await import('effect/Effect');

    return { readDatabaseKey: Effect.succeed(null) };
});
vi.mock('../src/@generic/utils/reload-app.util', () => import('./fixture/reload-app-fake'));
vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));

const restoreLayer = Layer.effect(CloudRestoreService, CloudRestoreService.make).pipe(
    Layer.provide([
        Layer.mock(SettingsRepository)({ getSettings: () => Effect.succeed(DEFAULT_SETTINGS) }),
        Layer.mock(CloudTransport)({ downloadBackup: () => Effect.succeed({ fileUri: 'download', backupKey: 'key' }) }),
        Layer.mock(DatabaseRekeyService)({
            transcodeDatabaseFile: () => Effect.void,
            exportEncryptedCopy: () => Effect.sync(() => void operations.push('safety-copy'))
        }),
        Layer.mock(DatabaseImportService)({
            canOpenBackup: () => Effect.succeed(false),
            importFromUri: () => Effect.sync(() => void operations.push('import'))
        })
    ])
);

describe('CloudRestoreService', () => {
    it.effect('returns a typed unreadable error before creating a safety copy or importing', () =>
        Effect.gen(function* () {
            operations.splice(0);
            storage.files.set('download', 'download');
            const service = yield* CloudRestoreService;
            const exit = yield* Effect.exit(service.restore('unreadable'));
            expect(Exit.isFailure(exit)).toBe(true);
            if (Exit.isFailure(exit)) {
                expect(Cause.squash(exit.cause)).toMatchObject({ _tag: 'CloudBackupUnreadableError' });
            }
            expect(operations).not.toContain('safety-copy');
            expect(operations).not.toContain('import');
        }).pipe(Effect.provide([restoreLayer, inertDbLayer, Reactivity.layer]))
    );
});
