import { BankIntegrationEntityTable, PRECISION, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { binanceStub, buildBinance, fetchFiatOrderEntries, resyncBinance, setupFiatScenario, TestLayer, testDb } from '../../harness';

import type { TimeWindow } from '../../harness';

const ORDER_NO = 'fiat-repair';
const EUR_98 = 98 * PRECISION;
const REPAIR_ORDER = buildBinance.fiatOrder({ orderNo: ORDER_NO, fiatCurrency: 'EUR', amount: '100', totalFee: '2' });

const importAsPreviousVersion = (isDeposit: boolean) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;

        const { sync } = yield* setupFiatScenario();
        binanceStub.fiatOrders(isDeposit ? [REPAIR_ORDER] : [], isDeposit ? [] : [REPAIR_ORDER]);
        yield* binanceSyncService.sync();
        yield* testDb.update(BankIntegrationEntityTable).set({ historyProgress: null });

        return sync;
    });

describe('binance/fiat-repair', () => {
    it.effect.each([
        { name: 'deposit', isDeposit: true, mainType: TransactionEntryTypeEnum.DEBIT, mainAmount: 102 * PRECISION },
        { name: 'withdrawal', isDeposit: false, mainType: TransactionEntryTypeEnum.CREDIT, mainAmount: 100 * PRECISION }
    ])('corrects an old-style fiat $name row in place on the next sync', ({ isDeposit, mainType, mainAmount }) =>
        Effect.gen(function* () {
            const sync = yield* importAsPreviousVersion(isDeposit);
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ amount: EUR_98 })
                .where(eq(TransactionEntryEntityTable.externalId, ORDER_NO));

            yield* resyncBinance(sync.id);

            const { mainEntries, feeEntries } = yield* fetchFiatOrderEntries(ORDER_NO);
            expect(mainEntries).toHaveLength(1);
            expect(feeEntries).toHaveLength(1);
            expect(mainEntries[0].type).toBe(mainType);
            expect(mainEntries[0].amount).toBe(mainAmount);
            expect(feeEntries[0].amount).toBe(2 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves a correct fiat row unchanged', () =>
        Effect.gen(function* () {
            const sync = yield* importAsPreviousVersion(true);
            const before = yield* fetchFiatOrderEntries(ORDER_NO);

            yield* resyncBinance(sync.id);

            expect(yield* fetchFiatOrderEntries(ORDER_NO)).toEqual(before);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs only once', () =>
        Effect.gen(function* () {
            const sync = yield* importAsPreviousVersion(true);
            const requestedWindows: TimeWindow[] = [];
            binanceStub.fiatOrders([REPAIR_ORDER], [], requestedWindows);

            yield* resyncBinance(sync.id);
            const repairRequestCount = requestedWindows.length;
            yield* resyncBinance(sync.id);

            expect(repairRequestCount).toBeGreaterThan(0);
            expect(requestedWindows).toHaveLength(repairRequestCount);
        }).pipe(Effect.provide(TestLayer))
    );
});
