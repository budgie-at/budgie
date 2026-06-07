import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/bank-sync';
import {
    AccountEntityTable,
    AccountTypeEnum,
    BankSyncModeEnum,
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { buildBinance, binanceStub, seed, setupBinanceFixture, testDb } from '../../harness';

const seedInstrument = (code: string) => seed.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });

const EARN_MONTH_DIGITS = 2;

const buildEarnMonthKey = (timeMs: number): string => {
    const date = new Date(timeMs);
    const year = date.getUTCFullYear();
    const month = `${date.getUTCMonth() + 1}`.padStart(EARN_MONTH_DIGITS, '0');

    return `${year}-${month}`;
};

const recentDayInMonthsAgo = (monthsAgo: number): number => {
    const now = new Date();
    const dayInMonth = monthsAgo === 0 ? 1 : 15;

    return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, dayInMonth);
};

const fetchTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE)).all();

const fetchAccountByExternalId = (externalId: string) =>
    testDb.select().from(AccountEntityTable).where(eq(AccountEntityTable.externalId, externalId)).all();

const fetchEntryByExternalId = (externalId: string) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.externalId, externalId)).all();

describe('binance/account-agnostic-sources', () => {
    it('creates C2C, earn, fiat, deposit and withdrawal transactions for all assets in a single backward run, not just the first account', async () => {
        seedInstrument('ETH');
        seedInstrument('BTC');
        const eurInstrument = seed.instrument({ code: 'EUR', name: 'EUR', symbol: 'EUR', type: InstrumentTypeEnum.FIAT });
        const eurExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'EUR' });
        seed.account({
            externalId: eurExternalId,
            externalSource: ExternalSourceEnum.BINANCE,
            type: AccountTypeEnum.CRYPTO_SYNC,
            instrumentId: eurInstrument.id
        });

        const { account: usdtAccount } = setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.BACKWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
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

        await binanceSyncService.sync();

        const externalIds = fetchTransactions()
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

        const usdtP2pEntry = fetchEntryByExternalId('binance:c2c:usdt-p2p-buy');
        expect(usdtP2pEntry).toHaveLength(1);
        expect(usdtP2pEntry[0].accountId).toBe(usdtAccount.id);

        const ethExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'ETH' });
        const ethAccount = fetchAccountByExternalId(ethExternalId);
        expect(ethAccount).toHaveLength(1);
        expect(fetchEntryByExternalId('eth-dep')[0].accountId).toBe(ethAccount[0].id);

        const btcExternalId = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'BTC' });
        const btcAccount = fetchAccountByExternalId(btcExternalId);
        expect(btcAccount).toHaveLength(1);
        expect(fetchEntryByExternalId('btc-wd')[0].accountId).toBe(btcAccount[0].id);

        const eurAccount = fetchAccountByExternalId(eurExternalId);
        expect(fetchEntryByExternalId('eur-fiat-dep')[0].accountId).toBe(eurAccount[0].id);

        const incomeCount = fetchTransactions().filter(transaction => transaction.type === TransactionTypeEnum.INCOME).length;
        expect(incomeCount).toBe(5);
    });

    it('commits C2C and earn income even when fiat returns no orders, proving per-type incremental commit', async () => {
        const { account: usdtAccount } = setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.BACKWARD });
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        const earnTime = recentDayInMonthsAgo(0);
        binanceStub.c2cOrders([buildBinance.c2cOrder({ orderNumber: 'usdt-c2c', tradeType: 'BUY', asset: 'USDT', amount: '100' })], []);
        binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: earnTime })]);
        binanceStub.fiatOrders([], []);

        await binanceSyncService.sync();

        const externalIds = fetchTransactions()
            .map(transaction => transaction.externalId)
            .sort();
        expect(externalIds).toStrictEqual([`binance:c2c:usdt-c2c`, `binance:earn:USDT:${buildEarnMonthKey(earnTime)}`].sort());
        expect(fetchEntryByExternalId('binance:c2c:usdt-c2c')[0].accountId).toBe(usdtAccount.id);
    });
});
