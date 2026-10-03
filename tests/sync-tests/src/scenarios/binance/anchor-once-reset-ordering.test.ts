import {
    AccountBalanceRepository,
    AccountTypeEnum,
    SyncModeEnum,
    SyncStatusEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    PRECISION
} from '@budgie/contracts';
import { BinanceSyncService, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import {} from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchCachedBalanceAmount,
    resetBinanceSyncForResync,
    seed,
    setupBinanceFixture,
    TestLayer
} from '../../harness';

describe('binance/anchor-once-reset-ordering', () => {
    it.effect('anchors every Binance account exactly once per run via beforeProcessRun across a multi-pass loop', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });

            const ethInstrument = yield* seed.instrument({ code: 'ETH', name: 'ETH', symbol: 'ETH', type: InstrumentTypeEnum.CRYPTO });
            const ethAccount = yield* seed.account({
                externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ETH' }),
                externalSource: ExternalSourceEnum.BINANCE,
                type: AccountTypeEnum.CRYPTO_SYNC,
                instrumentId: ethInstrument.id
            });
            yield* seed.sync({
                accountId: ethAccount.id,
                token: JSON.stringify({ apiKey: 'test-api-key', apiSecret: 'test-api-secret' }),
                provider: ExternalSourceEnum.BINANCE,
                mode: SyncModeEnum.BACKWARD,
                status: SyncStatusEnum.SYNCING
            });

            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'BTC', free: '1' }),
                buildBinance.balance({ asset: 'ETH', free: '2' })
            ]);

            const upsertSpy = vi.spyOn(accountBalanceRepository, 'upsert');

            yield* binanceSyncService.sync();

            expect(upsertSpy).toHaveBeenCalledTimes(2);

            upsertSpy.mockRestore();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('resets run-state via beforeSyncRun before the loop, so a second run re-anchors the fresh balance', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const binanceSyncService = yield* BinanceSyncService;

            const { account } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });

            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);

            yield* binanceSyncService.sync();

            expect(yield* fetchCachedBalanceAmount(account.id)).toBe(PRECISION);

            resetBinanceSyncForResync();
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '5' })]);

            const upsertSpy = vi.spyOn(accountBalanceRepository, 'upsert');
            yield* binanceSyncService.sync();

            expect(upsertSpy).toHaveBeenCalled();
            expect(yield* fetchCachedBalanceAmount(account.id)).toBe(5 * PRECISION);

            upsertSpy.mockRestore();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('anchors an existing account to zero when Binance omits the asset from balances', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const binanceSyncService = yield* BinanceSyncService;

            const { account } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            yield* accountBalanceRepository.upsert({ accountId: account.id, amount: 7 * PRECISION });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'ETH', free: '2' })]);

            yield* binanceSyncService.sync();

            expect(yield* fetchCachedBalanceAmount(account.id)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not anchor an existing account to zero when Binance reports an unrepresentable balance', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const binanceSyncService = yield* BinanceSyncService;

            const { account } = yield* setupBinanceFixture({ asset: 'PEPE', mode: SyncModeEnum.BACKWARD });
            yield* accountBalanceRepository.upsert({ accountId: account.id, amount: 7 * PRECISION });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'PEPE', free: '99999999999' })]);

            yield* binanceSyncService.sync();

            expect(yield* fetchCachedBalanceAmount(account.id)).toBe(7 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not send signed requests or disable sync when the background deadline is already expired', () =>
        Effect.gen(function* () {
            const accountBalanceRepository = yield* AccountBalanceRepository;
            const binanceSyncService = yield* BinanceSyncService;

            const { sync } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            const upsertSpy = vi.spyOn(accountBalanceRepository, 'upsert');

            yield* binanceSyncService.sync(Date.now() - 1);

            expect(upsertSpy).not.toHaveBeenCalled();
            expect(yield* fetchCachedBalanceAmount(sync.accountId)).toBeUndefined();

            upsertSpy.mockRestore();
        }).pipe(Effect.provide(TestLayer))
    );
});
