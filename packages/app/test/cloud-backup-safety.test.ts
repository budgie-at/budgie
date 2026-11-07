import { CloudSyncTransportError, ICloudErrorCode, ICloudAccountStatusEnum } from '@budgie/cloud-sync';
import { Db, SettingsRepository, SyncZoneRegistryRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Exit from 'effect/Exit';
import * as Layer from 'effect/Layer';
import { vi } from 'vitest';

import { appAtomRegistry } from '../src/@generic/constant/app-atom-registry.constant';
import { DatabaseRekeyService } from '../src/@generic/drizzle/service/database-rekey.service';
import { cloudBackupStatusAtom } from '../src/cloud-backup/constant/cloud-backup-status-atom.constant';
import { CloudBackupStatusEnum } from '../src/cloud-backup/enum/cloud-backup-status.enum';
import { CloudBackupService } from '../src/cloud-backup/service/cloud-backup.service';
import { CloudTransport } from '../src/cloud-backup/service/cloud-transport.service';
import { InstallIdService } from '../src/cloud-backup/service/install-id.service';
import { DEFAULT_SETTINGS } from '../src/settings/constants/default-settings.constant';

import { storage } from './fixture/expo-file-system-fake';
import { inertDbLayer } from './fixture/inert-db-layer';

const behavior = vi.hoisted(() => ({ retentionFails: false, backupEnabled: true }));

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
vi.mock('expo-file-system', () => import('./fixture/expo-file-system-fake'));

const backupLayer = Layer.effect(CloudBackupService, CloudBackupService.make).pipe(
    Layer.provide([
        Layer.mock(SettingsRepository)({
            getSettings: () => Effect.succeed({ ...DEFAULT_SETTINGS, cloudBackupEnabled: behavior.backupEnabled, lastCloudBackupAt: null }),
            update: () => Effect.succeed(DEFAULT_SETTINGS)
        }),
        Layer.mock(SyncZoneRegistryRepository)({ findByLabel: () => Effect.undefined }),
        Layer.mock(CloudTransport)({
            getAccountStatus: Effect.succeed({ status: ICloudAccountStatusEnum.AVAILABLE, userRecordName: 'owner' }),
            saveBackup: () => Effect.succeed('saved'),
            listBackups: Effect.suspend(() =>
                behavior.retentionFails
                    ? Effect.fail(CloudSyncTransportError.make({ code: ICloudErrorCode.NETWORK_UNAVAILABLE, message: 'retention failed' }))
                    : Effect.succeed([])
            )
        }),
        Layer.mock(DatabaseRekeyService)({
            generateKey: () => Effect.succeed('key'),
            exportEncryptedCopy: (path: string) => Effect.sync(() => void storage.files.set(path, 'backup'))
        }),
        Layer.mock(InstallIdService)({ get: Effect.succeed('install') })
    ])
);

describe('cloud backup safety copy', () => {
    it.effect('clears waiting status when there is nothing to upload', () =>
        Effect.gen(function* () {
            behavior.backupEnabled = false;
            appAtomRegistry.set(cloudBackupStatusAtom, CloudBackupStatusEnum.NETWORK_UNAVAILABLE);
            yield* Effect.gen(function* () {
                expect(yield* Effect.flatMap(CloudBackupService, service => service.backup(0))).toBe(false);
                expect(appAtomRegistry.get(cloudBackupStatusAtom)).toBe(CloudBackupStatusEnum.READY);
            }).pipe(
                Effect.ensuring(
                    Effect.sync(() => {
                        behavior.backupEnabled = true;
                    })
                )
            );
        }).pipe(Effect.provide([backupLayer, inertDbLayer]))
    );
    it.effect('keeps READY after a successful upload when retention fails', () =>
        Effect.gen(function* () {
            behavior.retentionFails = true;
            const query = vi.spyOn(Db, 'query').mockReturnValue(Effect.succeed([{ lastChangedAt: 1 }]));
            yield* Effect.gen(function* () {
                expect(Exit.isFailure(yield* Effect.exit(Effect.flatMap(CloudBackupService, service => service.backup(0))))).toBe(true);
                expect(appAtomRegistry.get(cloudBackupStatusAtom)).toBe(CloudBackupStatusEnum.READY);
            }).pipe(
                Effect.ensuring(
                    Effect.sync(() => {
                        behavior.retentionFails = false;
                        query.mockRestore();
                    })
                )
            );
        }).pipe(Effect.provide([backupLayer, inertDbLayer]))
    );
    it.effect('keeps the pre-restore copy when a new backup completes successfully', () =>
        Effect.gen(function* () {
            storage.deleted.splice(0);
            const query = vi.spyOn(Db, 'query').mockReturnValue(Effect.succeed([{ lastChangedAt: 1 }]));
            yield* Effect.gen(function* () {
                expect(yield* Effect.flatMap(CloudBackupService, service => service.backup(0))).toBe(true);
                expect(storage.deleted.length).toBeGreaterThan(0);
                expect(storage.deleted.every(path => path.startsWith('cache/cloud-backup-'))).toBe(true);
            }).pipe(Effect.ensuring(Effect.sync(() => void query.mockRestore())));
        }).pipe(Effect.provide([backupLayer, inertDbLayer]))
    );
});
