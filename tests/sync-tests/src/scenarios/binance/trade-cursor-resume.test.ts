import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncEntityTable } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, seedCryptoInstrument, setupAdaUsdtForwardFixture, testDb } from '../../harness';

const RECURRING_SYNC_AGE_MS = 5 * 60 * 1000;
const RESUME_TRADE_ID = 42;

describe('binance/trade-cursor-resume', () => {
    it('resumes recurring myTrades requests from the persisted per-symbol fromId cursor', async () => {
        const forwardSyncedAt = new Date(Date.now() - RECURRING_SYNC_AGE_MS);

        seedCryptoInstrument('ADA');
        const { sync } = setupAdaUsdtForwardFixture(forwardSyncedAt, JSON.stringify({ ADAUSDT: RESUME_TRADE_ID }));
        const requestedUrls: URL[] = [];

        binanceStub.myTrades({}, new Set<string>(), requestedUrls);
        await binanceSyncService.sync();

        expect(requestedUrls.length).toBeGreaterThan(0);
        expect(requestedUrls[0].searchParams.get('fromId')).toBe(String(RESUME_TRADE_ID + 1));
        expect(requestedUrls[0].searchParams.has('startTime')).toBe(false);
        expect(testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.id, sync.id)).get()?.binanceTradeCursor).toBe(
            JSON.stringify({ ADAUSDT: RESUME_TRADE_ID })
        );
    });
});
