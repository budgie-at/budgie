import { SyncEntityTable, SyncStatusEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schedule from 'effect/Schedule';

import {
    BINANCE_TEST_TOKEN,
    buildBinance,
    seedCryptoInstrument,
    stubBinanceAccountEndpoints,
    stubEmptyBinanceEndpoints,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';
import { testDb } from '../../harness/scenario/test-db';

const SYNC_ONLY_PATH = '/sapi/v1/c2c/orderMatch/listUserOrderHistory';

const stubSelectedBtcAccount = () =>
    Effect.gen(function* () {
        yield* seedCryptoInstrument('BTC');
        stubEmptyBinanceEndpoints();
        stubBinanceAccountEndpoints([buildBinance.balance({ asset: 'BTC', free: '1' })]);
    });

describe('binance/setup-sync', () => {
    it.effect('starts Binance sync after setting up selected accounts', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* stubSelectedBtcAccount();

            const requestedPaths: string[] = [];
            const recordRequestedPath = ({ request }: { readonly request: Request }) => {
                requestedPaths.push(new URL(request.url).pathname);
            };
            mockServer.events.on('request:start', recordRequestedPath);

            yield* Effect.addFinalizer(() =>
                Effect.sync(() => void mockServer.events.removeListener('request:start', recordRequestedPath))
            );

            yield* binanceSyncService.setupAccountSyncBatch(BINANCE_TEST_TOKEN, ['SPOT:BTC']);

            const syncs = yield* testDb
                .select()
                .from(SyncEntityTable)
                .pipe(
                    Effect.repeat({
                        schedule: Schedule.spaced(20),
                        until: rows => rows.every(row => row.status !== SyncStatusEnum.SYNCING)
                    })
                );

            expect(syncs.every(row => row.status === SyncStatusEnum.IDLE)).toBe(true);
            expect(requestedPaths).toContain(SYNC_ONLY_PATH);
        }).pipe(Effect.provide(TestLayer))
    );
});
