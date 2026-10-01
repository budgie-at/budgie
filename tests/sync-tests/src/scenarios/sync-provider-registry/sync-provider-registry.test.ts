import { SYNC_PROVIDER_CAPABILITIES } from '@app/sync/constant/sync-provider-capabilities.constant';
import { ErsteSyncService } from '@app/sync/service/erste-sync.service';
import { MonobankSyncService } from '@app/sync/service/monobank-sync.service';
import { SyncProviderRegistryService } from '@app/sync/service/sync-provider-registry.service';
import { ExternalSourceEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, TestLayer } from '../../harness';


const seedAccount = () =>
    Effect.gen(function* () {
        return yield* seed.account({ externalId: `test-${Math.random()}`, instrumentId: 1 });
    });

const resolveServiceForProvider = Effect.fnUntraced(function* (provider: ExternalSourceEnum) {
    const syncProviderRegistryService = yield* SyncProviderRegistryService;
    const account = yield* seedAccount();
    yield* seed.sync({ accountId: account.id, provider });

    return yield* syncProviderRegistryService.getServiceForAccount(account.id);
});

describe('SyncProviderRegistryService', () => {
    describe('getServiceForAccount', () => {
        it.effect('returns monobank service for account with MONOBANK bank sync', () =>
            Effect.gen(function* () {
                const monobankSyncService = yield* MonobankSyncService;

                expect(yield* resolveServiceForProvider(ExternalSourceEnum.MONOBANK)).toBe(monobankSyncService);
            }).pipe(Effect.provide(TestLayer))
        );

        it.effect('returns erste service for account with ERSTE bank sync', () =>
            Effect.gen(function* () {
                const ersteSyncService = yield* ErsteSyncService;

                expect(yield* resolveServiceForProvider(ExternalSourceEnum.ERSTE)).toBe(ersteSyncService);
            }).pipe(Effect.provide(TestLayer))
        );

        it.effect('returns null for account with no bank sync record', () =>
            Effect.gen(function* () {
                const syncProviderRegistryService = yield* SyncProviderRegistryService;
                const account = yield* seedAccount();

                expect(yield* syncProviderRegistryService.getServiceForAccount(account.id)).toBeNull();
            }).pipe(Effect.provide(TestLayer))
        );

        it.effect('returns null for REVOLUT provider (no registered service)', () =>
            Effect.gen(function* () {
                expect(yield* resolveServiceForProvider(ExternalSourceEnum.REVOLUT)).toBeNull();
            }).pipe(Effect.provide(TestLayer))
        );
    });

    describe('supportsTokenAuth', () => {
        it('monobank provider supports token auth', () => {
            expect(SYNC_PROVIDER_CAPABILITIES[ExternalSourceEnum.MONOBANK].supportsTokenAuth).toBe(true);
        });

        it('erste provider does not support token auth', () => {
            expect(SYNC_PROVIDER_CAPABILITIES[ExternalSourceEnum.ERSTE].supportsTokenAuth).toBe(false);
        });
    });
});
