import { BinanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncEntityTable, SyncModeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { binanceStub, seedCryptoInstrument, setupAdaUsdtFixture, testDb, TestLayer } from '../../harness';

const RECURRING_SYNC_AGE_MS = 5 * 60 * 1000;
const RESUME_TRADE_ID = 42;

const runAdaUsdtSyncWithCursor = Effect.fnUntraced(function* (mode: SyncModeEnum) {
    const binanceSyncService = yield* BinanceSyncService;

    yield* seedCryptoInstrument('ADA');
    const { sync } = yield* setupAdaUsdtFixture(
        mode,
        new Date(Date.now() - RECURRING_SYNC_AGE_MS),
        JSON.stringify({ ADAUSDT: RESUME_TRADE_ID })
    );
    const requestedUrls: URL[] = [];

    binanceStub.myTrades({}, new Set<string>(), requestedUrls);
    yield* binanceSyncService.sync();

    return { syncId: sync.id, requestedUrls };
});

describe('binance/trade-cursor-resume', () => {
    it.effect('resumes recurring myTrades requests from the persisted per-symbol fromId cursor', () =>
        Effect.gen(function* () {
            const { syncId, requestedUrls } = yield* runAdaUsdtSyncWithCursor(SyncModeEnum.FORWARD);

            expect(requestedUrls.length).toBeGreaterThan(0);
            expect(requestedUrls[0].searchParams.get('fromId')).toBe(String(RESUME_TRADE_ID + 1));
            expect(requestedUrls[0].searchParams.has('startTime')).toBe(false);
            expect((yield* testDb.select().from(SyncEntityTable).where(eq(SyncEntityTable.id, syncId)))[0]?.binanceTradeCursor).toBe(
                JSON.stringify({ ADAUSDT: RESUME_TRADE_ID })
            );
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('ignores the persisted cursor on a backward run so older trades are still fetched', () =>
        Effect.gen(function* () {
            const { requestedUrls } = yield* runAdaUsdtSyncWithCursor(SyncModeEnum.BACKWARD);

            expect(requestedUrls.length).toBeGreaterThan(0);
            expect(requestedUrls[0].searchParams.has('fromId')).toBe(false);
            expect(requestedUrls[0].searchParams.has('startTime')).toBe(true);
        }).pipe(Effect.provide(TestLayer))
    );
});
