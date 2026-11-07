import { ICloudAccountStatusEnum } from '@budgie/cloud-sync';
import { Db, SettingsRepository, SyncZoneRegistryRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { DatabaseRekeyService } from '../src/@generic/drizzle/service/database-rekey.service';
import { CloudBackupService } from '../src/cloud-backup/service/cloud-backup.service';
import { CloudTransport } from '../src/cloud-backup/service/cloud-transport.service';
import { InstallIdService } from '../src/cloud-backup/service/install-id.service';
import { DEFAULT_SETTINGS } from '../src/settings/constants/default-settings.constant';

import { inertDbLayer } from './fixture/inert-db-layer';

const deleted = vi.hoisted(() => new Array<string>());
vi.mock('@lingui/core/macro', () => ({ msg: (message: unknown) => message, t: (parts: TemplateStringsArray) => parts.join('') }));
vi.mock('expo-constants', () => ({ default: {} }));
vi.mock('react-native', () => ({ Platform: { OS: 'ios', constants: {} } }));
vi.mock('../src/@generic/drizzle/service/database-rekey.service', async () => {
    const Context = await import('effect/Context');

    return { DatabaseRekeyService: Context.Service<object>('test/BackupRekey') };
});
vi.mock('../src/cloud-backup/service/cloud-transport.service', async () => {
    const Context = await import('effect/Context');

    return { CloudTransport: Context.Service<object>('test/BackupTransport') };
});
vi.mock('../src/cloud-backup/service/install-id.service', async () => {
    const Context = await import('effect/Context');

    return { InstallIdService: Context.Service<object>('test/BackupInstallId') };
});
vi.mock('../src/@generic/drizzle/utils/read-last-migration-created-at.util', async () => {
    const Effect = await import('effect/Effect');

    return { readLastMigrationCreatedAt: () => Effect.succeed(0) };
});
vi.mock('expo-file-system', () => {
    class FileMock {
        readonly uri: string;
        readonly exists = true;

        constructor(parent: string, name: string) {
            this.uri = `${parent}/${name}`;
        }

        delete() {
            deleted.push(this.uri);
        }
    }

    return { File: FileMock, Paths: { cache: 'cache' } };
});

const backupLayer = Layer.effect(CloudBackupService, CloudBackupService.make).pipe(
    Layer.provide([
        Layer.mock(SettingsRepository)({
            getSettings: () => Effect.succeed({ ...DEFAULT_SETTINGS, cloudBackupEnabled: true, lastCloudBackupAt: null }),
            update: () => Effect.succeed(DEFAULT_SETTINGS)
        }),
        Layer.mock(SyncZoneRegistryRepository)({ findByLabel: () => Effect.undefined }),
        Layer.mock(CloudTransport)({
            getAccountStatus: Effect.succeed({ status: ICloudAccountStatusEnum.AVAILABLE, userRecordName: 'owner' }),
            saveBackup: () => Effect.succeed('saved'),
            listBackups: Effect.succeed([])
        }),
        Layer.mock(DatabaseRekeyService)({ generateKey: () => Effect.succeed('key'), exportEncryptedCopy: () => Effect.void }),
        Layer.mock(InstallIdService)({ get: Effect.succeed('install') })
    ])
);

describe('cloud backup safety copy', () => {
    it.effect('keeps the pre-restore copy when a new backup completes successfully', () =>
        Effect.gen(function* () {
            deleted.splice(0);
            const query = vi.spyOn(Db, 'query').mockReturnValue(Effect.succeed([{ lastChangedAt: 1 }]));
            yield* Effect.gen(function* () {
                expect(yield* Effect.flatMap(CloudBackupService, service => service.backup(0))).toBe(true);
                expect(deleted.length).toBeGreaterThan(0);
                expect(deleted.every(path => path.startsWith('cache/cloud-backup-'))).toBe(true);
            }).pipe(Effect.ensuring(Effect.sync(() => void query.mockRestore())));
        }).pipe(Effect.provide([backupLayer, inertDbLayer]))
    );
});
