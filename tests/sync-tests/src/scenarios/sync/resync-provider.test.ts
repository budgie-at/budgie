import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { BinanceSyncService, MonobankSyncService, ResyncService } from '@budgie/sync';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { fetchSyncById, seed, TestLayer } from '../../harness';

const resyncAccountOf = Effect.fnUntraced(function* (provider: ExternalSourceEnum) {
    const resyncService = yield* ResyncService;
    const monobankSyncService = yield* MonobankSyncService;
    const binanceSyncService = yield* BinanceSyncService;
    const monobankRequestSync = vi.spyOn(monobankSyncService, 'requestSync').mockReturnValue(Effect.void);
    vi.spyOn(monobankSyncService, 'fetchSetupBalance').mockReturnValue(Effect.succeed(0));
    const binanceRequestSync = vi.spyOn(binanceSyncService, 'requestSync').mockReturnValue(Effect.void);
    const account = yield* seed.account({ type: AccountTypeEnum.BANK_SYNC, externalSource: provider });
    const sync = yield* seed.sync({ accountId: account.id, provider, enabled: provider !== ExternalSourceEnum.PRIVATBANK });

    yield* resyncService.resync({ accountId: account.id, sinceDays: null });

    expect((yield* fetchSyncById(sync.id)).enabled).toBe(provider !== ExternalSourceEnum.PRIVATBANK);

    return { monobankRequestSync, binanceRequestSync };
});

describe('sync/resync-provider', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('restarts only the Binance sync when a Binance account is resynced', () =>
        Effect.gen(function* () {
            const { monobankRequestSync, binanceRequestSync } = yield* resyncAccountOf(ExternalSourceEnum.BINANCE);

            expect(monobankRequestSync).not.toHaveBeenCalled();
            expect(binanceRequestSync).toHaveBeenCalledOnce();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('restarts only the Monobank sync when a Monobank account is resynced', () =>
        Effect.gen(function* () {
            const { monobankRequestSync, binanceRequestSync } = yield* resyncAccountOf(ExternalSourceEnum.MONOBANK);

            expect(monobankRequestSync).toHaveBeenCalledOnce();
            expect(binanceRequestSync).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('starts no polling sync when a file-import account is resynced', () =>
        Effect.gen(function* () {
            const { monobankRequestSync, binanceRequestSync } = yield* resyncAccountOf(ExternalSourceEnum.PRIVATBANK);

            expect(monobankRequestSync).not.toHaveBeenCalled();
            expect(binanceRequestSync).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );
});
