import { AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { BinanceSyncService, MonobankSyncService, ResyncService } from '@budgie/sync';
import { afterEach, describe, expect, it, vi } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { seed, TestLayer } from '../../harness';

const resyncAccountOf = Effect.fnUntraced(function* (provider: ExternalSourceEnum) {
    const resyncService = yield* ResyncService;
    const monobankSyncService = yield* MonobankSyncService;
    const binanceSyncService = yield* BinanceSyncService;
    const monobankSync = vi.spyOn(monobankSyncService, 'sync').mockReturnValue(Effect.succeed(true));
    const binanceRequestSync = vi.spyOn(binanceSyncService, 'requestSync').mockReturnValue(Effect.void);
    const account = yield* seed.account({ type: AccountTypeEnum.BANK_SYNC, externalSource: provider });
    yield* seed.sync({ accountId: account.id, provider });

    yield* resyncService.resync({ accountId: account.id, sinceDays: null });

    return { monobankSync, binanceRequestSync };
});

describe('sync/resync-provider', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it.effect('restarts only the Binance sync when a Binance account is resynced', () =>
        Effect.gen(function* () {
            const { monobankSync, binanceRequestSync } = yield* resyncAccountOf(ExternalSourceEnum.BINANCE);

            expect(monobankSync).not.toHaveBeenCalled();
            expect(binanceRequestSync).toHaveBeenCalledOnce();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('starts no polling sync when a file-import account is resynced', () =>
        Effect.gen(function* () {
            const { monobankSync, binanceRequestSync } = yield* resyncAccountOf(ExternalSourceEnum.PRIVATBANK);

            expect(monobankSync).not.toHaveBeenCalled();
            expect(binanceRequestSync).not.toHaveBeenCalled();
        }).pipe(Effect.provide(TestLayer))
    );
});
