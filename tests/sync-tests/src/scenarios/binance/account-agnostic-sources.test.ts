import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import {
    AccountEntityTable,
    AccountTypeEnum,
    SyncModeEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionTypeEnum
} from '@budgie/contracts';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import {
    binanceStub,
    buildBinance,
    buildEarnMonthKey,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    recentDayInMonthsAgo,
    seed,
    seedCryptoInstrument,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    testDb
} from '../../harness';

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
            `binance:earn:USDT:${buildEarnMonthKey(previousMonth)}`,
            `binance:earn:USDT:${buildEarnMonthKey(currentMonth)}`,
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
    it('creates C2C, earn, fiat, deposit and withdrawal transactions for all assets in a single backward run, not just the first account', async () => {
        const { eurExternalId, usdtFundingAccount } = seedAccountAgnosticAccounts();
        const { previousMonth, currentMonth } = stubAccountAgnosticSourceResponses();

        await binanceSyncService.sync();

        expectAllSourceExternalIds(previousMonth, currentMonth);
        expectSourceAccounts(usdtFundingAccount.id, eurExternalId);
        const incomeCount = fetchBinanceTransactions().filter(transaction => transaction.type === TransactionTypeEnum.INCOME).length;
        expect(incomeCount).toBe(5);
    });

    it('commits C2C and earn income even when fiat returns no orders, proving per-type incremental commit', async () => {
        const { instrument: usdtInstrument } = setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.BACKWARD });
        const usdtFundingAccount = seedUsdtFundingAccount(usdtInstrument.id);
        stubEmptyBinanceBalances();
        const earnTime = recentDayInMonthsAgo(0);
        binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'usdt-c2c', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
        binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: earnTime })]);
        binanceStub.fiatOrders([], []);

        await binanceSyncService.sync();

        const externalIds = fetchBinanceTransactions()
            .map(transaction => transaction.externalId)
            .sort();
        expect(externalIds).toStrictEqual([`binance:c2c:usdt-c2c`, `binance:earn:USDT:${buildEarnMonthKey(earnTime)}`].sort());
        expect(fetchBinanceEntriesByExternalId('binance:c2c:usdt-c2c')[0].accountId).toBe(usdtFundingAccount.id);
    });
});
