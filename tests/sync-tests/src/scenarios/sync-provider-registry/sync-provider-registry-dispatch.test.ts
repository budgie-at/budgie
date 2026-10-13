import { ExternalSourceEnum } from '@budgie/contracts';
import {
    BinanceSyncService,
    ErsteSyncService,
    MonobankSyncService,
    PrivatbankSyncService,
    SyncProviderRegistryService
} from '@budgie/sync';
import { beforeEach, describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import { vi } from 'vitest';

import { seed, TestLayer } from '../../harness';

const seedSyncedAccount = Effect.fnUntraced(function* (provider: ExternalSourceEnum) {
    const account = yield* seed.account({ externalId: `${provider}-routing`, instrumentId: 1 });
    yield* seed.sync({ accountId: account.id, provider });

    return account;
});

describe('SyncProviderRegistryService dispatch', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('routes a Binance account toggle through the Binance sync service', () =>
        Effect.gen(function* () {
            const syncProviderRegistryService = yield* SyncProviderRegistryService;
            const binanceSetAccountSyncEnabled = vi.spyOn(yield* BinanceSyncService, 'setAccountSyncEnabled').mockReturnValue(Effect.void);
            const monobankSetAccountSyncEnabled = vi
                .spyOn(yield* MonobankSyncService, 'setAccountSyncEnabled')
                .mockReturnValue(Effect.void);
            const account = yield* seedSyncedAccount(ExternalSourceEnum.BINANCE);

            yield* syncProviderRegistryService.setAccountSyncEnabled(account.id, false);

            expect(binanceSetAccountSyncEnabled).toHaveBeenCalledWith(account.id, false);
            expect(monobankSetAccountSyncEnabled).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('routes a PrivatBank file import toggle through the PrivatBank sync service', () =>
        Effect.gen(function* () {
            const syncProviderRegistryService = yield* SyncProviderRegistryService;
            const privatbankSetAccountSyncEnabled = vi
                .spyOn(yield* PrivatbankSyncService, 'setAccountSyncEnabled')
                .mockReturnValue(Effect.void);
            const monobankSetAccountSyncEnabled = vi
                .spyOn(yield* MonobankSyncService, 'setAccountSyncEnabled')
                .mockReturnValue(Effect.void);
            const account = yield* seedSyncedAccount(ExternalSourceEnum.PRIVATBANK);

            yield* syncProviderRegistryService.setAccountSyncEnabled(account.id, false);

            expect(privatbankSetAccountSyncEnabled).toHaveBeenCalledWith(account.id, false);
            expect(monobankSetAccountSyncEnabled).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('routes a token update to the Monobank sync service', () =>
        Effect.gen(function* () {
            const syncProviderRegistryService = yield* SyncProviderRegistryService;
            const monobankUpdateAccountToken = vi.spyOn(yield* MonobankSyncService, 'updateAccountToken').mockReturnValue(Effect.void);
            const binanceUpdateAccountToken = vi.spyOn(yield* BinanceSyncService, 'updateAccountToken').mockReturnValue(Effect.void);
            const account = yield* seedSyncedAccount(ExternalSourceEnum.MONOBANK);

            yield* syncProviderRegistryService.updateAccountToken(account.id, 'new-token');

            expect(monobankUpdateAccountToken).toHaveBeenCalledWith(account.id, 'new-token');
            expect(binanceUpdateAccountToken).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores a token update for a file import provider and an account without a sync', () =>
        Effect.gen(function* () {
            const syncProviderRegistryService = yield* SyncProviderRegistryService;
            const ersteSyncService = yield* ErsteSyncService;
            const ersteSetAccountSyncEnabled = vi.spyOn(ersteSyncService, 'setAccountSyncEnabled');
            const monobankUpdateAccountToken = vi.spyOn(yield* MonobankSyncService, 'updateAccountToken').mockReturnValue(Effect.void);
            const ersteAccount = yield* seedSyncedAccount(ExternalSourceEnum.ERSTE);
            const unsyncedAccount = yield* seed.account({ externalId: 'unsynced-routing', instrumentId: 1 });

            yield* syncProviderRegistryService.updateAccountToken(ersteAccount.id, 'new-token');
            yield* syncProviderRegistryService.updateAccountToken(unsyncedAccount.id, 'new-token');
            yield* syncProviderRegistryService.setAccountSyncEnabled(unsyncedAccount.id, false);

            expect(monobankUpdateAccountToken).not.toHaveBeenCalled();
            expect(ersteSetAccountSyncEnabled).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );
});
