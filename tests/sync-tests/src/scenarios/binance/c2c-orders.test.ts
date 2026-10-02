import { BinanceSyncService } from '@app/sync/service/binance-sync.service';
import { TransferConsolidationDrainerService } from '@app/sync/service/transfer-consolidation-drainer.service';
import {
    AccountTypeEnum,
    CurrencyEnum,
    ExternalSourceEnum,
    PRECISION,
    SyncEntityTable,
    SyncModeEnum,
    SyncWarningEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it, vi } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchExpenseEntries,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    fetchSyncById,
    resetBinanceSyncForResync,
    requireInstrument,
    seed,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    testDb,
    TestLayer
} from '../../harness';

const setupForwardUsdtScenario = () => {
    const fixture = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
    stubEmptyBinanceBalances();

    return fixture;
};

const stubBuyC2cOrder = (orderNumber: string): void => {
    binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber, tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
};

const seedFundingAccount = (instrumentId: number) =>
    seed.account({
        externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' }),
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId
    });

const seedExistingBinanceIncome = (accountId: number, externalId: string, operatedAt = new Date()) => {
    const transaction = seed.bankPairIncome({ externalId, operatedAt }, { accountId, amount: PRECISION, mccCategoryId: null });
    seed.updateTransaction(transaction.id, { externalSource: ExternalSourceEnum.BINANCE });

    return transaction;
};

const HISTORICAL_OPERATED_AT = new Date('2026-01-01T00:00:00.000Z');

describe('binance/c2c-orders reconciliation', () => {
    it.effect('stores P2P orders on the Funding wallet account', () =>
        Effect.gen(function* () {
            const { token } = setupBinanceFixture({ asset: 'USDT', wallet: BinanceWalletEnum.FUNDING, mode: SyncModeEnum.FORWARD });
            stubBuyC2cOrder('c2c-funding-buy');

            const transactions = yield* new BinanceSignedClient(token).getC2cTransactions(0);

            expect(transactions[0].accountId).toBe(encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' }));
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('queues consolidation after moving an existing P2P entry from Spot to Funding', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const enqueue = vi.mocked(transferConsolidationDrainerService.enqueue);

            const { account: spotAccount, instrument } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            const fundingAccount = seedFundingAccount(instrument.id);
            const externalId = 'binance:c2c:c2c-existing';
            seedExistingBinanceIncome(spotAccount.id, externalId);
            stubEmptyBinanceBalances();
            stubBuyC2cOrder('c2c-existing');

            yield* binanceSyncService.sync();

            const entries = fetchBinanceEntriesByExternalId(externalId);
            const uah = yield* requireInstrument(CurrencyEnum.UAH);
            expect(entries).toEqual([
                expect.objectContaining({
                    accountId: fundingAccount.id,
                    quotedInstrumentId: uah.id,
                    quotedAmount: 100 * PRECISION,
                    quotedUnitPrice: PRECISION
                })
            ]);
            expect(enqueue.mock.calls).toContainEqual([]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('moves only the Binance entry when another provider uses the same external id', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { account: spotAccount, instrument } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            const fundingAccount = seedFundingAccount(instrument.id);
            const unrelatedAccount = seed.account({ externalId: 'unrelated-account', instrumentId: instrument.id });
            const externalId = 'binance:c2c:c2c-shared-external-id';
            const unrelatedTransaction = seed.bankPairIncome(
                { externalId, operatedAt: new Date() },
                { accountId: unrelatedAccount.id, amount: PRECISION, mccCategoryId: null }
            );
            const existingTransaction = seedExistingBinanceIncome(spotAccount.id, externalId);
            stubEmptyBinanceBalances();
            stubBuyC2cOrder('c2c-shared-external-id');

            yield* binanceSyncService.sync();

            expect(fetchExpenseEntries(unrelatedTransaction.id)[0]?.accountId).toBe(unrelatedAccount.id);
            expect(fetchExpenseEntries(existingTransaction.id)[0]?.accountId).toBe(fundingAccount.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('queues scoped consolidation when an existing P2P entry is already in Funding', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const transferConsolidationDrainerService = yield* TransferConsolidationDrainerService;
            const enqueue = vi.mocked(transferConsolidationDrainerService.enqueue);

            const { account: fundingAccount } = setupBinanceFixture({
                asset: 'USDT',
                wallet: BinanceWalletEnum.FUNDING,
                mode: SyncModeEnum.FORWARD
            });
            const externalId = 'binance:c2c:c2c-existing-funding';
            const existingTransaction = seedExistingBinanceIncome(fundingAccount.id, externalId);
            const historicalTransaction = seedExistingBinanceIncome(
                fundingAccount.id,
                'binance:c2c:c2c-historical-funding',
                HISTORICAL_OPERATED_AT
            );
            stubEmptyBinanceBalances();
            stubBuyC2cOrder('c2c-existing-funding');

            yield* binanceSyncService.sync();

            expect(enqueue.mock.calls).toEqual(
                expect.arrayContaining([[expect.objectContaining({ transactionIds: [existingTransaction.id] })]])
            );
            expect(fetchBinanceTransactions().map(transaction => transaction.id)).toContain(historicalTransaction.id);
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('binance/c2c-orders mapping', () => {
    it.effect('maps a P2P BUY order to an INCOME transaction on the asset account', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupForwardUsdtScenario();
            binanceStub.c2cOrders(
                [
                    buildBinance.c2cOrder({
                        orderNumber: 'c2c-buy-1',
                        tradeType: 'BUY',
                        asset: 'USDT',
                        amount: '585.91',
                        totalPrice: '25842',
                        unitPrice: '44.1'
                    })
                ],
                []
            );

            yield* binanceSyncService.sync();

            expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, 'binance:c2c:c2c-buy-1');
            const uah = yield* requireInstrument(CurrencyEnum.UAH);
            expect(fetchBinanceEntriesByExternalId('binance:c2c:c2c-buy-1')[0]).toMatchObject({
                quotedInstrumentId: uah.id,
                quotedAmount: Number('25842') * PRECISION,
                quotedUnitPrice: Number('44.1') * PRECISION
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('maps a P2P SELL order to an EXPENSE transaction', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupForwardUsdtScenario();
            binanceStub.c2cOrders(
                [],
                [buildBinance.c2cOrder({ orderNumber: 'c2c-sell-1', tradeType: 'SELL', asset: 'USDT', amount: '50' })]
            );

            yield* binanceSyncService.sync();

            expectSingleBinanceTransaction(TransactionTypeEnum.EXPENSE, 'binance:c2c:c2c-sell-1');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('skips non-COMPLETED C2C orders', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupForwardUsdtScenario();
            binanceStub.c2cOrders(
                [
                    buildBinance.c2cOrder({
                        orderNumber: 'c2c-pending',
                        tradeType: 'BUY',
                        asset: 'USDT',
                        amount: '100',
                        orderStatus: 'PENDING'
                    })
                ],
                []
            );

            yield* binanceSyncService.sync();

            expect(fetchBinanceTransactions()).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not create duplicate C2C transactions on a second sync run', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            setupForwardUsdtScenario();
            stubBuyC2cOrder('c2c-dup');

            yield* binanceSyncService.sync();
            expect(fetchBinanceTransactions()).toHaveLength(1);

            resetBinanceSyncForResync();
            stubBuyC2cOrder('c2c-dup');
            yield* binanceSyncService.sync();

            expect(fetchBinanceTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('treats a 403 on the C2C endpoint as non-fatal, still syncs deposits, and surfaces a user-visible warning', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { sync } = setupForwardUsdtScenario();
            binanceStub.c2cUnavailable();
            binanceStub.deposits([buildBinance.deposit({ id: 'dep-after-c2c-403', coin: 'USDT', amount: '5' })]);

            yield* binanceSyncService.sync();

            const transactions = fetchBinanceTransactions();
            expect(transactions).toHaveLength(1);
            expect(transactions[0].externalId).toBe('dep-after-c2c-403');
            expect(fetchSyncById(sync.id).lastWarning).toBe(SyncWarningEnum.C2C_UNAVAILABLE);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('clears a previously recorded C2C warning once the C2C endpoint becomes available again', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { sync } = setupForwardUsdtScenario();
            binanceStub.c2cUnavailable();
            binanceStub.deposits([]);
            yield* binanceSyncService.sync();
            expect(fetchSyncById(sync.id).lastWarning).toBe(SyncWarningEnum.C2C_UNAVAILABLE);

            resetBinanceSyncForResync();
            testDb.update(SyncEntityTable).set({ forwardSyncedAt: null }).where(eq(SyncEntityTable.id, sync.id)).run();
            stubBuyC2cOrder('c2c-recovered');
            binanceStub.deposits([]);
            yield* binanceSyncService.sync();

            expect(fetchSyncById(sync.id).lastWarning).toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );
});
