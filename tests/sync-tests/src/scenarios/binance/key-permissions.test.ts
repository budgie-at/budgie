import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    BINANCE_TEST_TOKEN,
    binanceStub,
    buildBinance,
    fetchAccountIntegrationToken,
    setupBinanceFixture,
    stubBinanceAccountEndpoints,
    TestLayer
} from '../../harness';

const ROTATED_TOKEN = JSON.stringify({ apiKey: 'rotated-key', apiSecret: 'rotated-secret' });

const stubConnectAccounts = () => stubBinanceAccountEndpoints([buildBinance.balance({ asset: 'BTC', free: '1' })]);

const expectPreviewAccepted = (stubRestrictions: () => void) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;
        stubConnectAccounts();
        stubRestrictions();

        const previews = yield* binanceSyncService.fetchAccountsPreview(BINANCE_TEST_TOKEN);

        expect(previews.length).toBeGreaterThan(0);
    }).pipe(Effect.provide(TestLayer));

describe('binance/key-permissions', () => {
    it.effect.each([
        'enableSpotAndMarginTrading',
        'enableWithdrawals',
        'enableInternalTransfer',
        'permitsUniversalTransfer',
        'enableMargin',
        'enableFutures',
        'enableVanillaOptions',
        'enablePortfolioMarginTrading'
    ] as const)('rejects a key with %s on connect', permission =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            stubConnectAccounts();
            binanceStub.apiRestrictions({ [permission]: true });

            const error = yield* Effect.flip(binanceSyncService.fetchAccountsPreview(BINANCE_TEST_TOKEN));

            expect(error).toMatchObject({ _tag: 'BinanceKeyPermissionsError', permissions: [permission] });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('accepts a read-only key on connect', () => expectPreviewAccepted(() => binanceStub.apiRestrictions()));

    it.effect('treats flags missing from the response as not granted', () =>
        expectPreviewAccepted(() => binanceStub.apiRestrictionsBody({ ipRestrict: false, enableReading: true }))
    );

    it.effect('reports an undecodable permissions response as an unverifiable key', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            stubConnectAccounts();
            binanceStub.apiRestrictionsBody({ enableWithdrawals: 'yes' });

            const error = yield* Effect.flip(binanceSyncService.fetchAccountsPreview(BINANCE_TEST_TOKEN));

            expect(error).toMatchObject({ _tag: 'BinanceKeyPermissionsError', permissions: [] });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rejects rotating to a key with withdraw rights and keeps the stored credentials', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const fixture = yield* setupBinanceFixture();
            binanceStub.apiRestrictions({ enableWithdrawals: true });

            const error = yield* Effect.flip(binanceSyncService.updateAccountToken(fixture.account.id, ROTATED_TOKEN));

            expect(error).toMatchObject({ _tag: 'BinanceKeyPermissionsError', permissions: ['enableWithdrawals'] });
            expect(yield* fetchAccountIntegrationToken(fixture.account.id)).toBe(fixture.token);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('rotates to a read-only key', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const fixture = yield* setupBinanceFixture();
            binanceStub.apiRestrictions();

            yield* binanceSyncService.updateAccountToken(fixture.account.id, ROTATED_TOKEN);

            expect(yield* fetchAccountIntegrationToken(fixture.account.id)).toBe(ROTATED_TOKEN);
        }).pipe(Effect.provide(TestLayer))
    );
});
