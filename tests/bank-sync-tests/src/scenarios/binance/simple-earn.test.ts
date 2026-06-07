import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/bank-sync';
import { BankSyncModeEnum, ExternalSourceEnum, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, setupBinanceFixture, testDb } from '../../harness';

const TOKEN = JSON.stringify({ apiKey: 'k', apiSecret: 's' });
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

describe('binance/simple-earn', () => {
    it('folds the LD* Earn position into the base asset balance as one account', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([buildBinance.balance({ asset: '1INCH', free: '10' })]);
        binanceStub.fundingBalances([]);
        binanceStub.earnPositions([buildBinance.earnPosition({ asset: 'LD1INCH', totalAmount: '5' })]);
        binanceStub.lockedEarnPositions([]);

        const client = new BinanceSignedClient(TOKEN);
        const result = await client.getAccounts();

        expect(result.success).toBe(true);
        if (result.success) {
            const oneInchAccounts = result.data.filter(account => account.currencyCode === '1INCH');
            expect(oneInchAccounts).toHaveLength(1);
            expect(oneInchAccounts[0].id).toBe(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: '1INCH' }));
            expect(oneInchAccounts[0].balance).toBe(15);
        }
    });

    it('folds Earn into an asset held only in Earn (no spot balance)', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([]);
        binanceStub.fundingBalances([]);
        binanceStub.earnPositions([buildBinance.earnPosition({ asset: 'LDUSDT', totalAmount: '40' })]);
        binanceStub.lockedEarnPositions([]);

        const client = new BinanceSignedClient(TOKEN);
        const result = await client.getAccounts();

        expect(result.success).toBe(true);
        if (result.success) {
            const usdtAccounts = result.data.filter(account => account.currencyCode === 'USDT');
            expect(usdtAccounts).toHaveLength(1);
            expect(usdtAccounts[0].balance).toBe(40);
        }
    });

    it('parks an asset whose post-fold balance exceeds MAX_SAFE_INTEGER', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'PEPE', free: '9000000000' })]);
        binanceStub.fundingBalances([]);
        binanceStub.earnPositions([buildBinance.earnPosition({ asset: 'LDPEPE', totalAmount: '900000000' })]);
        binanceStub.lockedEarnPositions([]);

        const client = new BinanceSignedClient(TOKEN);
        const result = await client.getAccounts();

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.map(account => account.currencyCode)).not.toContain('PEPE');
        }
    });

    it('aggregates a month of Earn rewards into a single INCOME transaction', async () => {
        const monthStart = recentDayInMonthsAgo(1);
        const firstReward = monthStart;
        const lastReward = monthStart + 5 * 86_400_000;
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.earnRewards([
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: firstReward }),
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.25', time: lastReward })
        ]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.INCOME);
        expect(transactions[0].externalId).toBe(`binance:earn:USDT:${buildEarnMonthKey(firstReward)}`);
    });

    it('emits one Earn transaction per calendar month per asset', async () => {
        const previousMonth = recentDayInMonthsAgo(1);
        const currentMonth = recentDayInMonthsAgo(0);
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.earnRewards([
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: previousMonth }),
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: previousMonth + 5 * 86_400_000 }),
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: currentMonth })
        ]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        const externalIds = transactions.map(transaction => transaction.externalId).sort();
        expect(externalIds).toStrictEqual(
            [`binance:earn:USDT:${buildEarnMonthKey(previousMonth)}`, `binance:earn:USDT:${buildEarnMonthKey(currentMonth)}`].sort()
        );
    });

    it('does not create duplicate Earn reward transactions on a second sync run', async () => {
        const rewardTime = recentDayInMonthsAgo(0);
        setupBinanceFixture({ asset: 'USDT', mode: BankSyncModeEnum.FORWARD });
        binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: rewardTime })]);

        await binanceSyncService.sync();
        expect(fetchTransactions()).toHaveLength(1);

        Object.assign(binanceSyncService, { isRunning: false });
        binanceStub.serverTime();
        binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: rewardTime })]);
        await binanceSyncService.sync();

        expect(fetchTransactions()).toHaveLength(1);
    });
});
