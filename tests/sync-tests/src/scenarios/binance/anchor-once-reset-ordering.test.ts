import { accountBalanceRepository } from '@app/@generic/drizzle/db/db';
import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import {
    AccountBalanceEntityTable,
    AccountTypeEnum,
    SyncModeEnum,
    SyncStatusEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    PRECISION
} from '@budgie/contracts';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import { describe, expect, it, vi } from 'vitest';

import { binanceStub, buildBinance, resetBinanceSyncForResync, seed, setupBinanceFixture, testDb } from '../../harness';

const fetchAnchoredAmount = (accountId: number): number | undefined =>
    testDb.select().from(AccountBalanceEntityTable).where(eq(AccountBalanceEntityTable.accountId, accountId)).get()?.amount;

describe('binance/anchor-once-reset-ordering', () => {
    it('anchors every Binance account exactly once per run via beforeProcessRun across a multi-pass loop', async () => {
        setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });

        const ethInstrument = seed.instrument({ code: 'ETH', name: 'ETH', symbol: 'ETH', type: InstrumentTypeEnum.CRYPTO });
        const ethAccount = seed.account({
            externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ETH' }),
            externalSource: ExternalSourceEnum.BINANCE,
            type: AccountTypeEnum.CRYPTO_SYNC,
            instrumentId: ethInstrument.id
        });
        seed.sync({
            accountId: ethAccount.id,
            token: JSON.stringify({ apiKey: 'test-api-key', apiSecret: 'test-api-secret' }),
            provider: ExternalSourceEnum.BINANCE,
            mode: SyncModeEnum.BACKWARD,
            status: SyncStatusEnum.SYNCING
        });

        binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' }), buildBinance.balance({ asset: 'ETH', free: '2' })]);

        const upsertSpy = vi.spyOn(accountBalanceRepository, 'upsert');

        await binanceSyncService.sync();

        expect(upsertSpy).toHaveBeenCalledTimes(2);

        upsertSpy.mockRestore();
    });

    it('resets run-state via beforeSyncRun before the loop, so a second run re-anchors the fresh balance', async () => {
        const { account } = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });

        binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' })]);

        await binanceSyncService.sync();

        expect(fetchAnchoredAmount(account.id)).toBe(PRECISION);

        resetBinanceSyncForResync();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '5' })]);

        const upsertSpy = vi.spyOn(accountBalanceRepository, 'upsert');
        await binanceSyncService.sync();

        expect(upsertSpy).toHaveBeenCalled();
        expect(fetchAnchoredAmount(account.id)).toBe(5 * PRECISION);

        upsertSpy.mockRestore();
    });
});
