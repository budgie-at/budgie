import { SyncEntityTable, SyncModeEnum, SyncStatusEnum, TransactionEntityTable, YieldKindEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    resetBinanceSyncForResync,
    seedCryptoInstrument,
    setupBinanceFixture,
    testDb,
    TestLayer
} from '../../harness';

const HOUR_MS = 60 * 60 * 1000;

const readKind = (externalId: string) =>
    testDb
        .select({ yieldKind: TransactionEntityTable.yieldKind })
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalId, externalId))
        .pipe(Effect.map(([row]) => row.yieldKind));

const syncAgain = (syncId: number) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;

        resetBinanceSyncForResync();
        yield* testDb
            .update(SyncEntityTable)
            .set({ forwardSyncedAt: new Date(Date.now() - HOUR_MS), status: SyncStatusEnum.IDLE })
            .where(eq(SyncEntityTable.id, syncId));
        yield* binanceSyncService.sync();
    });

describe('binance/yield-refinement', () => {
    it.effect('refines a DISTRIBUTION dividend on the next sync but never a user-edited one', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dividendTime = Date.now() - HOUR_MS / 2;

            yield* seedCryptoInstrument('BNB');

            const { sync } = yield* setupBinanceFixture({
                asset: 'USDT',
                mode: SyncModeEnum.FORWARD,
                forwardSyncFromAt: new Date(Date.now() - 2 * HOUR_MS)
            });

            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'BNB', free: '1' })
            ]);
            binanceStub.dividends([
                buildBinance.dividend({ tranId: 9401, asset: 'BNB', amount: '1', divTime: dividendTime, enInfo: 'ETH 2.0 Staking' }),
                buildBinance.dividend({ tranId: 9402, asset: 'BNB', amount: '1', divTime: dividendTime, enInfo: 'BNB Vault' })
            ]);
            yield* binanceSyncService.sync();

            expect(yield* readKind('binance:dividend:9401')).toBe(YieldKindEnum.STAKING);

            yield* testDb.$client.unsafe(
                `UPDATE transactions SET yield_kind = 'DISTRIBUTION' WHERE external_id IN ('binance:dividend:9401', 'binance:dividend:9402')`
            );
            yield* testDb.$client.unsafe(`UPDATE transactions SET updated_by = 'user' WHERE external_id = 'binance:dividend:9402'`);
            yield* syncAgain(sync.id);

            expect(yield* readKind('binance:dividend:9401')).toBe(YieldKindEnum.STAKING);
            expect(yield* readKind('binance:dividend:9402')).toBe(YieldKindEnum.DISTRIBUTION);
        }).pipe(Effect.provide(TestLayer))
    );
});
