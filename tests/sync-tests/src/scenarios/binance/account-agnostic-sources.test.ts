import { BinanceSyncService } from '@app/sync/service/binance-sync.service';
import {
    AccountEntityTable,
    AccountTypeEnum,
    SyncModeEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import * as FiberSet from 'effect/FiberSet';
import { HttpResponse, http } from 'msw';

import {
    binanceStub,
    buildBinance,
    buildEarnDayKey,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    recentDayInMonthsAgo,
    seed,
    seedCryptoInstrument,
    seedUsdtFundingAccount,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    testDb,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

import type { Services } from '../../harness/scenario/test-runtime';

const fetchAccountByExternalId = (externalId: string) =>
    Effect.gen(function* () {
        return yield* testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, externalId));
    });

const seedOrphanAccount = (externalId: string, instrumentId: number) =>
    seed.account({ externalId, externalSource: ExternalSourceEnum.BINANCE, type: AccountTypeEnum.CRYPTO_SYNC, instrumentId });

const seedAccountAgnosticAccounts = () =>
    Effect.gen(function* () {
        yield* seedCryptoInstrument('ETH');
        yield* seedCryptoInstrument('BTC');
        const eurInstrument = yield* seed.instrument({ code: 'EUR', name: 'EUR', symbol: 'EUR', type: InstrumentTypeEnum.FIAT });
        const eurExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'EUR' });
        yield* seed.account({
            externalId: eurExternalId,
            externalSource: ExternalSourceEnum.BINANCE,
            type: AccountTypeEnum.CRYPTO_SYNC,
            instrumentId: eurInstrument.id
        });
        const { instrument: usdtInstrument } = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });

        return { eurExternalId, usdtFundingAccount: yield* seedUsdtFundingAccount(usdtInstrument.id) };
    });

const stubAccountAgnosticSourceResponses = () => {
    stubEmptyBinanceBalances();
    const previousMonth = recentDayInMonthsAgo(1);
    const currentMonth = recentDayInMonthsAgo(0);
    binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'usdt-p2p-buy', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
    binanceStub.earnRewards([
        buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: previousMonth }),
        buildBinance.earnReward({ asset: 'USDT', rewards: '0.25', time: currentMonth })
    ]);
    binanceStub.fiatOrders([buildBinance.fiatOrder({ orderNo: 'eur-fiat-dep', fiatCurrency: 'EUR', amount: '200' })], []);
    binanceStub.deposits([buildBinance.deposit({ id: 'eth-dep', coin: 'ETH', amount: '3' })]);
    binanceStub.withdrawals([buildBinance.withdrawal({ id: 'btc-wd', coin: 'BTC', amount: '1', transactionFee: '0' })]);

    return { previousMonth, currentMonth };
};

const expectAllSourceExternalIds = (previousMonth: number, currentMonth: number) =>
    Effect.gen(function* () {
        const externalIds = (yield* fetchBinanceTransactions()).map(transaction => transaction.externalId).sort();
        expect(externalIds).toStrictEqual(
            [
                'binance:c2c:usdt-p2p-buy',
                `binance:earn:USDT:${buildEarnDayKey(previousMonth)}`,
                `binance:earn:USDT:${buildEarnDayKey(currentMonth)}`,
                'btc-wd',
                'eth-dep',
                'eur-fiat-dep'
            ].sort()
        );
    });

const expectSourceAccounts = (usdtFundingAccountId: number, eurExternalId: string) =>
    Effect.gen(function* () {
        expect((yield* fetchBinanceEntriesByExternalId('binance:c2c:usdt-p2p-buy'))[0].accountId).toBe(usdtFundingAccountId);
        const ethAccount = yield* fetchAccountByExternalId(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ETH' }));
        expect(ethAccount).toHaveLength(1);
        expect((yield* fetchBinanceEntriesByExternalId('eth-dep'))[0].accountId).toBe(ethAccount[0].id);
        const btcAccount = yield* fetchAccountByExternalId(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'BTC' }));
        expect(btcAccount).toHaveLength(1);
        expect((yield* fetchBinanceEntriesByExternalId('btc-wd'))[0].accountId).toBe(btcAccount[0].id);
        const eurAccount = yield* fetchAccountByExternalId(eurExternalId);
        expect((yield* fetchBinanceEntriesByExternalId('eur-fiat-dep'))[0].accountId).toBe(eurAccount[0].id);
    });

describe('binance/account-agnostic-sources', () => {
    it.effect('associates orphan Binance sync accounts before requesting provider balances', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const runPromise = yield* FiberSet.makeRuntimePromise<Services>();

            const instrument = yield* seedCryptoInstrument('LTC');
            const orphanExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'LTC' });
            const orphanAccount = yield* seedOrphanAccount(orphanExternalId, instrument.id);
            const { externalId } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            const integrationIdsAtProviderRequests: Array<number | null> = [];
            mockServer.use(
                http.post('https://api.binance.com/sapi/v3/asset/getUserAsset', () =>
                    runPromise(
                        Effect.gen(function* () {
                            const [accountAtRequest] = yield* testDb
                                .select()
                                .from(AccountEntityTable)
                                .where(eq(AccountEntityTable.id, orphanAccount.id));
                            integrationIdsAtProviderRequests.push(accountAtRequest.integrationId);

                            return HttpResponse.json([]);
                        })
                    )
                )
            );

            yield* binanceSyncService.sync();

            const [seededAccount] = yield* fetchAccountByExternalId(externalId);
            expect(integrationIdsAtProviderRequests[0]).toBe(seededAccount.integrationId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('associates accounts discovered during sync with the active Binance integration', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* seedCryptoInstrument('ETH');
            const { externalId } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            stubEmptyBinanceBalances();
            binanceStub.deposits([buildBinance.deposit({ id: 'eth-dep', coin: 'ETH', amount: '3' })]);

            yield* binanceSyncService.sync();

            const [seededAccount] = yield* fetchAccountByExternalId(externalId);
            const [discoveredAccount] = yield* fetchAccountByExternalId(
                encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ETH' })
            );
            expect(discoveredAccount.integrationId).toBe(seededAccount.integrationId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs existing Binance accounts without an integration association', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const instrument = yield* seedCryptoInstrument('LTC');
            const orphanExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'LTC' });
            yield* seedOrphanAccount(orphanExternalId, instrument.id);
            const { externalId } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            stubEmptyBinanceBalances();

            yield* binanceSyncService.sync();

            const [seededAccount] = yield* fetchAccountByExternalId(externalId);
            const [repairedAccount] = yield* fetchAccountByExternalId(orphanExternalId);
            expect(repairedAccount.integrationId).toBe(seededAccount.integrationId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves regular crypto accounts outside the Binance integration', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const instrument = yield* seedCryptoInstrument('ETH');
            const regularCryptoAccount = yield* seed.account({
                type: AccountTypeEnum.CRYPTO,
                instrumentId: instrument.id,
                externalSource: ExternalSourceEnum.BINANCE
            });
            const { externalId } = yield* setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            stubEmptyBinanceBalances();

            yield* binanceSyncService.sync();

            const [syncedRegularCryptoAccount] = yield* testDb
                .select()
                .from(AccountEntityTable)
                .where(eq(AccountEntityTable.id, regularCryptoAccount.id));
            const [binanceAccount] = yield* fetchAccountByExternalId(externalId);
            expect(syncedRegularCryptoAccount.integrationId).toBeNull();
            expect(binanceAccount.integrationId).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'creates C2C, earn, fiat, deposit and withdrawal transactions for all assets in a single backward run, not just the first account',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;

                const { eurExternalId, usdtFundingAccount } = yield* seedAccountAgnosticAccounts();
                const { previousMonth, currentMonth } = stubAccountAgnosticSourceResponses();

                yield* binanceSyncService.sync();

                yield* expectAllSourceExternalIds(previousMonth, currentMonth);
                yield* expectSourceAccounts(usdtFundingAccount.id, eurExternalId);
                const incomeCount = (yield* fetchBinanceTransactions()).filter(
                    transaction => transaction.type === TransactionTypeEnum.INCOME
                ).length;
                expect(incomeCount).toBe(5);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('commits C2C and earn income even when fiat returns no orders, proving per-type incremental commit', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { instrument: usdtInstrument } = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
            const usdtFundingAccount = yield* seedUsdtFundingAccount(usdtInstrument.id);
            stubEmptyBinanceBalances();
            const earnTime = recentDayInMonthsAgo(0);
            binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'usdt-c2c', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
            binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: earnTime })]);
            binanceStub.fiatOrders([], []);

            yield* binanceSyncService.sync();

            const externalIds = (yield* fetchBinanceTransactions()).map(transaction => transaction.externalId).sort();
            expect(externalIds).toStrictEqual([`binance:c2c:usdt-c2c`, `binance:earn:USDT:${buildEarnDayKey(earnTime)}`].sort());
            expect((yield* fetchBinanceEntriesByExternalId('binance:c2c:usdt-c2c'))[0].accountId).toBe(usdtFundingAccount.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
