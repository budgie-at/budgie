import { ersteSyncService } from '@app/sync/service/erste-sync.service';
import { monobankSyncService } from '@app/sync/service/monobank-sync.service';
import { syncProviderRegistryService } from '@app/sync/service/sync-provider-registry.service';
import { ExternalSourceEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { seed } from '../../harness';

import type { AccountEntityInterface } from '@budgie/contracts';

const seedAccount = (): AccountEntityInterface => seed.account({ externalId: `test-${Math.random()}`, instrumentId: 1 });

describe('SyncProviderRegistryService', () => {
    describe('getServiceForAccount', () => {
        it('returns monobank service for account with MONOBANK bank sync', async () => {
            const account = seedAccount();
            seed.sync({ accountId: account.id, provider: ExternalSourceEnum.MONOBANK });

            const service = await syncProviderRegistryService.getServiceForAccount(account.id);

            expect(service).toBe(monobankSyncService);
        });

        it('returns erste service for account with ERSTE bank sync', async () => {
            const account = seedAccount();
            seed.sync({ accountId: account.id, provider: ExternalSourceEnum.ERSTE });

            const service = await syncProviderRegistryService.getServiceForAccount(account.id);

            expect(service).toBe(ersteSyncService);
        });

        it('returns null for account with no bank sync record', async () => {
            const account = seedAccount();

            const service = await syncProviderRegistryService.getServiceForAccount(account.id);

            expect(service).toBeNull();
        });
    });

    describe('getServiceForProvider', () => {
        it('returns monobank service for MONOBANK provider', () => {
            const service = syncProviderRegistryService.getServiceForProvider(ExternalSourceEnum.MONOBANK);

            expect(service).toBe(monobankSyncService);
        });

        it('returns erste service for ERSTE provider', () => {
            const service = syncProviderRegistryService.getServiceForProvider(ExternalSourceEnum.ERSTE);

            expect(service).toBe(ersteSyncService);
        });

        it('returns null for REVOLUT provider (no registered service)', () => {
            const service = syncProviderRegistryService.getServiceForProvider(ExternalSourceEnum.REVOLUT);

            expect(service).toBeNull();
        });
    });

    describe('supportsTokenAuth', () => {
        it('monobank service supports token auth', () => {
            const service = syncProviderRegistryService.getServiceForProvider(ExternalSourceEnum.MONOBANK);

            expect(service?.supportsTokenAuth).toBe(true);
        });

        it('erste service does not support token auth', () => {
            const service = syncProviderRegistryService.getServiceForProvider(ExternalSourceEnum.ERSTE);

            expect(service?.supportsTokenAuth).toBe(false);
        });
    });
});
