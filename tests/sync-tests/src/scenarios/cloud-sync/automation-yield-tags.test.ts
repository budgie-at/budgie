import { AccountTypeEnum, ExternalSourceEnum, TransactionTypeEnum, YieldKindEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    Db,
    FakeCloudTransport,
    makeTestDbLayer,
    OPERATED_AT,
    pullWithAutomation,
    pushDevice,
    readOutboxRows,
    resetTestDb,
    testDb,
    TestSeedService
} from '../../harness';

describe('cloud-sync/automation-yield-tags', () => {
    it.layer(makeTestDbLayer(null), { excludeTestServices: true })('two devices', it => {
        it.effect('tags rows a cloud apply delivers untagged, without uploading the tags', () =>
            Effect.gen(function* () {
                const deviceB = yield* Db;
                const cloud = new FakeCloudTransport();

                yield* resetTestDb(deviceB);

                const seed = new TestSeedService(testDb);
                const binance = yield* seed.account({ title: 'BNB', type: AccountTypeEnum.CRYPTO_SYNC });

                yield* seed.manualExpense({
                    accountId: binance.id,
                    amount: 1_000_000,
                    operatedAt: OPERATED_AT,
                    title: 'Earn',
                    type: TransactionTypeEnum.INCOME,
                    externalId: 'binance:earn:BNB:2026-06-01',
                    externalSource: ExternalSourceEnum.BINANCE
                });
                yield* pushDevice(testDb, cloud);
                yield* pullWithAutomation(deviceB, cloud, 'device-b');

                const [row] = yield* deviceB.$client.unsafe<{ readonly yieldKind: string | null }>(
                    `SELECT yield_kind AS yieldKind FROM transactions WHERE title = 'Earn'`
                );

                expect(row.yieldKind).toBe(YieldKindEnum.EARN);
                expect(yield* readOutboxRows(deviceB)).toEqual([]);
            })
        );
    });
});
