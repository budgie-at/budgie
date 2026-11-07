import { BankOwnershipService } from '@budgie/cloud-sync';
import { BankIntegrationRepository, BankSyncInstallId, ExternalSourceEnum, SyncRecordRepository, SyncRepository } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as TestClock from 'effect/testing/TestClock';

import { seedMonobankTokenAccount, testDb } from '../../harness';

import { INSTALL_ID, makeSyncServiceContext } from './sync-service-harness';

const DAY_MILLISECONDS = 24 * 60 * 60 * 1000;

const readOwner = testDb.$client
    .unsafe<{ readonly owner: string | null }>('SELECT owner_install_id AS owner FROM bank_integrations')
    .pipe(Effect.map(([row]) => row.owner));

const deviceRecordPayload = (installId: string, lastSyncedAt: number) => JSON.stringify({ encryptedFields: { installId, lastSyncedAt } });

describe('cloud-sync/bank ownership', () => {
    it.effect.each(['personal', 'household'])('never claims placeholder credentials in %s', syncZone => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                yield* TestClock.setTime(Date.now());
                yield* seedMonobankTokenAccount('placeholder-card', 'synced-device-placeholder:integration');
                yield* testDb.$client.unsafe('UPDATE bank_integrations SET owner_install_id = ?, updated_at = 1, sync_zone = ?', [
                    'absent-owner',
                    syncZone
                ]);
                yield* (yield* BankOwnershipService).evaluate();
                expect(yield* readOwner).toBe('absent-owner');
            })
        );
    });

    it.effect('claims unowned integrations, keeps a fresh foreign owner and takes over after 14 days of silence', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                yield* TestClock.setTime(Date.now());
                yield* seedMonobankTokenAccount('card-1', 'token-1');

                const [integration] = yield* (yield* BankIntegrationRepository).findActive;
                const records = yield* SyncRecordRepository;
                const ownership = yield* BankOwnershipService;

                yield* ownership.evaluate();

                expect(yield* readOwner).toBe(INSTALL_ID);

                yield* testDb.$client.unsafe('UPDATE bank_integrations SET owner_install_id = ? WHERE id = ?', [
                    'install-b',
                    integration.id
                ]);
                yield* records.upsert({
                    syncZone: 'personal',
                    syncId: 'install-b',
                    recordType: 'SyncDevice',
                    systemFields: null,
                    payload: deviceRecordPayload('install-b', Date.now() - DAY_MILLISECONDS),
                    schemaVersion: 1
                });
                yield* ownership.evaluate();

                expect(yield* readOwner).toBe('install-b');

                yield* records.upsert({
                    syncZone: 'personal',
                    syncId: 'install-b',
                    recordType: 'SyncDevice',
                    systemFields: null,
                    payload: deviceRecordPayload('install-b', Date.now() - 15 * DAY_MILLISECONDS),
                    schemaVersion: 1
                });
                yield* ownership.evaluate();

                expect(yield* readOwner).toBe(INSTALL_ID);
            })
        );
    });

    it.effect('hides syncs of integrations owned by another install from the polling queries', () => {
        const context = makeSyncServiceContext();

        return context.run(
            Effect.gen(function* () {
                const repository = yield* SyncRepository;
                yield* seedMonobankTokenAccount('card-2', 'token-2');
                yield* testDb.$client.unsafe('UPDATE bank_integrations SET owner_install_id = ?', ['install-b']);

                const withInstall = (installId: string) =>
                    repository
                        .getEnabledByProvider(ExternalSourceEnum.MONOBANK)
                        .pipe(Effect.provideService(BankSyncInstallId, Effect.succeed(installId)));

                expect(yield* repository.getEnabledByProvider(ExternalSourceEnum.MONOBANK)).toHaveLength(1);
                expect(yield* withInstall(INSTALL_ID)).toHaveLength(0);
                expect(yield* withInstall('install-b')).toHaveLength(1);
            })
        );
    });
});
