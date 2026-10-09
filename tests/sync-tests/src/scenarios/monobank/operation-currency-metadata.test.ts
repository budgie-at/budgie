import { CurrencyEnum, PRECISION, TransactionEntityTable, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    buildMonobank,
    fetchExpenseEntries,
    monobankStub,
    MonobankSyncService,
    requireInstrument,
    seed,
    setupMonobankFixture,
    testDb,
    TestLayer
} from '../../harness';

const EUR_NUMERIC_CODE = 978;
const UNKNOWN_NUMERIC_CODE = 999;
const JPY_NUMERIC_CODE = 392;

const fetchPrimaryEntry = (externalId: string) =>
    Effect.gen(function* () {
        const [transaction] = yield* testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalId, externalId));
        const entries = yield* fetchExpenseEntries(transaction.id);
        const primaryEntry = entries.find(entry => entry.type === TransactionEntryTypeEnum.CREDIT);

        if (!isDefined(primaryEntry)) {
            return yield* Effect.die(new Error(`Primary entry for ${externalId} not found`));
        }

        return primaryEntry;
    });

describe('monobank/operation-currency-metadata', () => {
    it.effect('keeps the UAH source amount and persists the EUR operation instrument and amount', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'tx-deposit-eur',
                    description: 'Opening a deposit',
                    amount: -4_500_000,
                    operationAmount: -100_000,
                    currencyCode: EUR_NUMERIC_CODE,
                    hold: false
                })
            ]);

            yield* monobankSyncService.sync();

            const primaryEntry = yield* fetchPrimaryEntry('tx-deposit-eur');

            expect(primaryEntry.amount).toBe(45_000 * PRECISION);
            expect(primaryEntry.exchangeRate).toBe(45);
            expect(primaryEntry.operationInstrumentId).toBe(euro.id);
            expect(primaryEntry.operationAmount).toBe(1000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('reads Monobank zero-decimal operation amounts in whole units', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const yen = yield* requireInstrument(CurrencyEnum.JPY);
            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'tx-jpy',
                    amount: -50_000,
                    operationAmount: -1500,
                    currencyCode: JPY_NUMERIC_CODE,
                    hold: false
                })
            ]);

            yield* monobankSyncService.sync();

            const primaryEntry = yield* fetchPrimaryEntry('tx-jpy');

            expect(primaryEntry.amount).toBe(500 * PRECISION);
            expect(primaryEntry.exchangeRate).toBeCloseTo(500 / 1500);
            expect(primaryEntry.operationInstrumentId).toBe(yen.id);
            expect(primaryEntry.operationAmount).toBe(1500 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('keeps null operation metadata when the provider currency cannot be resolved', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            yield* setupMonobankFixture();
            monobankStub.statement([
                buildMonobank.transaction({
                    id: 'tx-unknown-currency',
                    amount: -10_000,
                    operationAmount: -300,
                    currencyCode: UNKNOWN_NUMERIC_CODE,
                    hold: false
                })
            ]);

            yield* monobankSyncService.sync();

            const primaryEntry = yield* fetchPrimaryEntry('tx-unknown-currency');

            expect(primaryEntry.operationInstrumentId).toBeNull();
            expect(primaryEntry.operationAmount).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([EUR_NUMERIC_CODE, UNKNOWN_NUMERIC_CODE])('refreshes the operation pair together for currency %s', currencyCode =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const { account } = yield* setupMonobankFixture();
            const report = buildMonobank.transaction({
                id: 'tx-operation-refresh',
                amount: -4_500_000,
                operationAmount: -200_000,
                currencyCode,
                hold: false
            });
            const transaction = yield* seed.bankPairExpense(
                { externalId: report.id, operatedAt: new Date(report.time * 1000) },
                { accountId: account.id, amount: 45_000 * PRECISION, exchangeRate: 45 }
            );
            yield* testDb
                .update(TransactionEntryEntityTable)
                .set({ operationInstrumentId: euro.id, operationAmount: 1000 * PRECISION })
                .where(eq(TransactionEntryEntityTable.transactionId, transaction.id));
            monobankStub.statement([report]);

            yield* monobankSyncService.sync();

            const entry = yield* fetchPrimaryEntry(report.id);

            expect(entry.exchangeRate).toBe(22.5);
            expect(entry.operationInstrumentId).toBe(currencyCode === EUR_NUMERIC_CODE ? euro.id : null);
            expect(entry.operationAmount).toBe(currencyCode === EUR_NUMERIC_CODE ? 2000 * PRECISION : null);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('fills operation metadata on a legacy imported entry during resync', () =>
        Effect.gen(function* () {
            const monobankSyncService = yield* MonobankSyncService;
            const euro = yield* requireInstrument(CurrencyEnum.EUR);
            const { account } = yield* setupMonobankFixture();
            const legacyTransaction = buildMonobank.transaction({
                id: 'tx-legacy-eur',
                amount: -4_100_000,
                operationAmount: -100_000,
                currencyCode: EUR_NUMERIC_CODE,
                hold: false
            });
            yield* seed.bankPairExpense(
                { externalId: 'tx-legacy-eur', operatedAt: new Date(legacyTransaction.time * 1000) },
                { accountId: account.id, amount: 41_000 * PRECISION, exchangeRate: 41 }
            );
            const legacyEntry = yield* fetchPrimaryEntry('tx-legacy-eur');
            monobankStub.statement([legacyTransaction]);

            yield* monobankSyncService.sync();

            const resyncedEntry = yield* fetchPrimaryEntry('tx-legacy-eur');

            expect(legacyEntry.operationInstrumentId).toBeNull();
            expect(resyncedEntry.id).toBe(legacyEntry.id);
            expect(resyncedEntry.operationInstrumentId).toBe(euro.id);
            expect(resyncedEntry.operationAmount).toBe(1000 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );
});
