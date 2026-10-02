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
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    testDb,
    TestLayer
} from '../../harness';
import { mockServer } from '../../harness/scenario/mock-server';

const fetchAccountByExternalId = (externalId: string) =>
    testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, externalId)).all();

const seedUsdtFundingAccount = (instrumentId: number) =>
    seed.account({
        externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' }),
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId
    });

const seedAccountAgnosticAccounts = () => {
    seedCryptoInstrument('ETH');
    seedCryptoInstrument('BTC');
    const eurInstrument = seed.instrument({ code: 'EUR', name: 'EUR', symbol: 'EUR', type: InstrumentTypeEnum.FIAT });
    const eurExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'EUR' });
    seed.account({
        externalId: eurExternalId,
        externalSource: ExternalSourceEnum.BINANCE,
        type: AccountTypeEnum.CRYPTO_SYNC,
        instrumentId: eurInstrument.id
    });
    const { instrument: usdtInstrument } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });

    return { eurExternalId, usdtFundingAccount: seedUsdtFundingAccount(usdtInstrument.id) };
};

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

const expectAllSourceExternalIds = (previousMonth: number, currentMonth: number): void => {
    const externalIds = fetchBinanceTransactions()
        .map(transaction => transaction.externalId)
        .sort();
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
};

const expectSourceAccounts = (usdtFundingAccountId: number, eurExternalId: string): void => {
    expect(fetchBinanceEntriesByExternalId('binance:c2c:usdt-p2p-buy')[0].accountId).toBe(usdtFundingAccountId);
    const ethAccount = fetchAccountByExternalId(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ETH' }));
    expect(ethAccount).toHaveLength(1);
    expect(fetchBinanceEntriesByExternalId('eth-dep')[0].accountId).toBe(ethAccount[0].id);
    const btcAccount = fetchAccountByExternalId(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'BTC' }));
    expect(btcAccount).toHaveLength(1);
    expect(fetchBinanceEntriesByExternalId('btc-wd')[0].accountId).toBe(btcAccount[0].id);
    const eurAccount = fetchAccountByExternalId(eurExternalId);
    expect(fetchBinanceEntriesByExternalId('eur-fiat-dep')[0].accountId).toBe(eurAccount[0].id);
};

describe('binance/account-agnostic-sources', () => {
    it.effect('associates orphan Binance sync accounts before requesting provider balances', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const instrument = seedCryptoInstrument('LTC');
            const orphanExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'LTC' });
            const orphanAccount = seed.account({
                externalId: orphanExternalId,
                externalSource: ExternalSourceEnum.BINANCE,
                type: AccountTypeEnum.CRYPTO_SYNC,
                instrumentId: instrument.id
            });
            const { externalId } = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            const integrationIdsAtProviderRequests: Array<number | null> = [];
            mockServer.use(
                http.post('https://api.binance.com/sapi/v3/asset/getUserAsset', () => {
                    const [accountAtRequest] = testDb
                        .select()
                        .from(AccountEntityTable)
                        .where(eq(AccountEntityTable.id, orphanAccount.id))
                        .all();
                    integrationIdsAtProviderRequests.push(accountAtRequest.integrationId);

                    return HttpResponse.json([]);
                })
            );

            yield* binanceSyncService.sync();

            const [seededAccount] = fetchAccountByExternalId(externalId);
            expect(integrationIdsAtProviderRequests[0]).toBe(seededAccount.integrationId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('associates accounts discovered during sync with the active Binance integration', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            seedCryptoInstrument('ETH');
            const { externalId } = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            stubEmptyBinanceBalances();
            binanceStub.deposits([buildBinance.deposit({ id: 'eth-dep', coin: 'ETH', amount: '3' })]);

            yield* binanceSyncService.sync();

            const [seededAccount] = fetchAccountByExternalId(externalId);
            const [discoveredAccount] = fetchAccountByExternalId(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ETH' }));
            expect(discoveredAccount.integrationId).toBe(seededAccount.integrationId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('repairs existing Binance accounts without an integration association', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const instrument = seedCryptoInstrument('LTC');
            const orphanExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'LTC' });
            seed.account({
                externalId: orphanExternalId,
                externalSource: ExternalSourceEnum.BINANCE,
                type: AccountTypeEnum.CRYPTO_SYNC,
                instrumentId: instrument.id
            });
            const { externalId } = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            stubEmptyBinanceBalances();

            yield* binanceSyncService.sync();

            const [seededAccount] = fetchAccountByExternalId(externalId);
            const [repairedAccount] = fetchAccountByExternalId(orphanExternalId);
            expect(repairedAccount.integrationId).toBe(seededAccount.integrationId);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('leaves regular crypto accounts outside the Binance integration', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const instrument = seedCryptoInstrument('ETH');
            const regularCryptoAccount = seed.account({
                type: AccountTypeEnum.CRYPTO,
                instrumentId: instrument.id,
                externalSource: ExternalSourceEnum.BINANCE
            });
            const { externalId } = setupBinanceFixture({ asset: 'BTC', mode: SyncModeEnum.BACKWARD });
            stubEmptyBinanceBalances();

            yield* binanceSyncService.sync();

            const [syncedRegularCryptoAccount] = testDb
                .select()
                .from(AccountEntityTable)
                .where(eq(AccountEntityTable.id, regularCryptoAccount.id))
                .all();
            const [binanceAccount] = fetchAccountByExternalId(externalId);
            expect(syncedRegularCryptoAccount.integrationId).toBeNull();
            expect(binanceAccount.integrationId).not.toBeNull();
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect(
        'creates C2C, earn, fiat, deposit and withdrawal transactions for all assets in a single backward run, not just the first account',
        () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;

                const { eurExternalId, usdtFundingAccount } = seedAccountAgnosticAccounts();
                const { previousMonth, currentMonth } = stubAccountAgnosticSourceResponses();

                yield* binanceSyncService.sync();

                expectAllSourceExternalIds(previousMonth, currentMonth);
                expectSourceAccounts(usdtFundingAccount.id, eurExternalId);
                const incomeCount = fetchBinanceTransactions().filter(
                    transaction => transaction.type === TransactionTypeEnum.INCOME
                ).length;
                expect(incomeCount).toBe(5);
            }).pipe(Effect.provide(TestLayer))
    );

    it.effect('commits C2C and earn income even when fiat returns no orders, proving per-type incremental commit', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            const { instrument: usdtInstrument } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
            const usdtFundingAccount = seedUsdtFundingAccount(usdtInstrument.id);
            stubEmptyBinanceBalances();
            const earnTime = recentDayInMonthsAgo(0);
            binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'usdt-c2c', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
            binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: earnTime })]);
            binanceStub.fiatOrders([], []);

            yield* binanceSyncService.sync();

            const externalIds = fetchBinanceTransactions()
                .map(transaction => transaction.externalId)
                .sort();
            expect(externalIds).toStrictEqual([`binance:c2c:usdt-c2c`, `binance:earn:USDT:${buildEarnDayKey(earnTime)}`].sort());
            expect(fetchBinanceEntriesByExternalId('binance:c2c:usdt-c2c')[0].accountId).toBe(usdtFundingAccount.id);
        }).pipe(Effect.provide(TestLayer))
    );
});
