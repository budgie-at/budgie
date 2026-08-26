import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncModeEnum, SyncStatusEnum } from '@budgie/contracts';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';

import { DEPOSIT_URL, binanceStub, buildBinance, expectSyncFailedAndDisabled, fetchSyncById, setupBinanceFixture } from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const RETRY_EXHAUSTION_TIMEOUT_MS = 30000;
const HTTP_BAD_REQUEST_STATUS = 400;
const ILLEGAL_PARAMETER_ERROR = { code: -1100, msg: 'Illegal characters found in parameter.' };

const expectSyncFailedAndEnabled = (syncId: number): void => {
    const sync = fetchSyncById(syncId);

    expect(sync).toMatchObject({
        enabled: true,
        status: SyncStatusEnum.FAILED
    });
    expect(sync.lastError).not.toBeNull();
};

describe('binance/error-recovery', () => {
    it('immediately disables a sync after an unauthorized Binance response', async () => {
        const { sync } = setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
        mockServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 401 })));

        await binanceSyncService.sync();

        expectSyncFailedAndDisabled(sync.id, 0);
    });

    it('disables every Binance asset sync row in the same credential group after an unauthorized response', async () => {
        const btcFixture = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.FORWARD });
        const ethFixture = setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });
        mockServer.use(http.get(DEPOSIT_URL, () => new HttpResponse(null, { status: 401 })));

        await binanceSyncService.sync();

        expectSyncFailedAndDisabled(btcFixture.sync.id, 0);
        expectSyncFailedAndDisabled(ethFixture.sync.id, 0);
    });

    it(
        'keeps a sync enabled after a malformed Binance source response',
        async () => {
            const { sync } = setupBinanceFixture({ mode: SyncModeEnum.FORWARD });
            mockServer.use(http.get(DEPOSIT_URL, () => HttpResponse.json({ unexpected: true })));

            await binanceSyncService.sync();

            expectSyncFailedAndEnabled(sync.id);
            expect(fetchSyncById(sync.id).forwardSyncedAt).toBeNull();
        },
        RETRY_EXHAUSTION_TIMEOUT_MS
    );

    it(
        'keeps every Binance asset sync row enabled after a generic provider source error',
        async () => {
            const btcFixture = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.FORWARD });
            const ethFixture = setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });
            mockServer.use(http.get(DEPOSIT_URL, () => HttpResponse.json({ unexpected: true })));

            await binanceSyncService.sync();

            expectSyncFailedAndEnabled(btcFixture.sync.id);
            expectSyncFailedAndEnabled(ethFixture.sync.id);
        },
        RETRY_EXHAUSTION_TIMEOUT_MS
    );

    it(
        'disables only the failed Binance asset sync row after an account-specific invalid transfer response',
        async () => {
            const usdtFixture = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            const ethFixture = setupBinanceFixture({ asset: 'ETH', mode: SyncModeEnum.FORWARD });
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'ADA', free: '200' })
            ]);
            binanceStub.exchangeInfo(['ADAUSDT']);
            binanceStub.myTradesFailure(HTTP_BAD_REQUEST_STATUS, ILLEGAL_PARAMETER_ERROR);

            await binanceSyncService.sync();

            expectSyncFailedAndDisabled(usdtFixture.sync.id, 0);
            expect(fetchSyncById(ethFixture.sync.id)).toMatchObject({
                enabled: true,
                status: SyncStatusEnum.SYNCING,
                lastError: null
            });
        },
        RETRY_EXHAUSTION_TIMEOUT_MS
    );
});
