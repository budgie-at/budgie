import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, seedCryptoInstrument, setupAdaUsdtFixture, testDb } from '../../harness';

const RECURRING_SYNC_AGE_MS = 5 * 60 * 1000;
const RESUME_TRADE_ID = 42;

const runAdaUsdtSyncWithCursor = async (mode: SyncModeEnum): Promise<{ syncId: number; requestedUrls: URL[] }> => {
    seedCryptoInstrument('ADA');
    const { sync } = setupAdaUsdtFixture(mode, new Date(Date.now() - RECURRING_SYNC_AGE_MS), JSON.stringify({ ADAUSDT: RESUME_TRADE_ID }));
    const requestedUrls: URL[] = [];

    binanceStub.myTrades({}, new Set<string>(), requestedUrls);
    await binanceSyncService.sync();

    return { syncId: sync.id, requestedUrls };
};

describe('binance/trade-cursor-resume', () => {
    it('resumes recurring myTrades requests from the persisted per-symbol fromId cursor', async () => {
        const { syncId, requestedUrls } = await runAdaUsdtSyncWithCursor(SyncModeEnum.FORWARD);

        expect(requestedUrls.length).toBeGreaterThan(0);
        expect(requestedUrls[0].searchParams.get('fromId')).toBe(String(RESUME_TRADE_ID + 1));
        expect(requestedUrls[0].searchParams.has('startTime')).toBe(false);
        expect(testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.id, syncId)).get()?.binanceTradeCursor).toBe(
            JSON.stringify({ ADAUSDT: RESUME_TRADE_ID })
        );
    });

    it('ignores the persisted cursor on a backward run so older trades are still fetched', async () => {
        const { requestedUrls } = await runAdaUsdtSyncWithCursor(SyncModeEnum.BACKWARD);

        expect(requestedUrls.length).toBeGreaterThan(0);
        expect(requestedUrls[0].searchParams.has('fromId')).toBe(false);
        expect(requestedUrls[0].searchParams.has('startTime')).toBe(true);
    });
});
