import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { SyncModeEnum, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    BINANCE_TEST_TOKEN,
    binanceStub,
    buildBinance,
    buildEarnMonthKey,
    expectSingleBinanceTransaction,
    fetchBinanceTransactions,
    recentDayInMonthsAgo,
    resetBinanceSyncForResync,
    setupBinanceFixture
} from '../../harness';

import type { SyncAccountInterface, BinanceAssetBalanceApiInterface, BinanceEarnPositionApiInterface } from '@budgie/sync';

const DAY_MS = 86_400_000;

const fetchFoldedAccounts = async (
    spotBalances: BinanceAssetBalanceApiInterface[],
    earnPositions: BinanceEarnPositionApiInterface[]
): Promise<SyncAccountInterface[]> => {
    binanceStub.serverTime();
    binanceStub.spotBalances(spotBalances);
    binanceStub.fundingBalances([]);
    binanceStub.earnPositions(earnPositions);
    binanceStub.lockedEarnPositions([]);

    const result = await new BinanceSignedClient(BINANCE_TEST_TOKEN).getAccounts();

    expect(result.success).toBe(true);

    return result.success ? result.data : [];
};

describe('binance/simple-earn', () => {
    it('folds the LD* Earn position into the base asset balance as one account', async () => {
        const accounts = await fetchFoldedAccounts(
            [buildBinance.balance({ asset: '1INCH', free: '10' })],
            [buildBinance.earnPosition({ asset: 'LD1INCH', totalAmount: '5' })]
        );

        const oneInchAccounts = accounts.filter(account => account.currencyCode === '1INCH');
        expect(oneInchAccounts).toHaveLength(1);
        expect(oneInchAccounts[0].id).toBe(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: '1INCH' }));
        expect(oneInchAccounts[0].balance).toBe(15);
    });

    it('folds Earn into an asset held only in Earn (no spot balance)', async () => {
        const accounts = await fetchFoldedAccounts([], [buildBinance.earnPosition({ asset: 'LDUSDT', totalAmount: '40' })]);

        const usdtAccounts = accounts.filter(account => account.currencyCode === 'USDT');
        expect(usdtAccounts).toHaveLength(1);
        expect(usdtAccounts[0].balance).toBe(40);
    });

    it('parks an asset whose post-fold balance exceeds MAX_SAFE_INTEGER', async () => {
        const accounts = await fetchFoldedAccounts(
            [buildBinance.balance({ asset: 'PEPE', free: '9000000000' })],
            [buildBinance.earnPosition({ asset: 'LDPEPE', totalAmount: '900000000' })]
        );

        expect(accounts.map(account => account.currencyCode)).not.toContain('PEPE');
    });

    it('aggregates a month of Earn rewards into a single INCOME transaction', async () => {
        const monthStart = recentDayInMonthsAgo(1);
        const firstReward = monthStart;
        const lastReward = monthStart + 5 * DAY_MS;
        setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
        binanceStub.earnRewards([
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: firstReward }),
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.25', time: lastReward })
        ]);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, `binance:earn:USDT:${buildEarnMonthKey(firstReward)}`);
    });

    it('emits one Earn transaction per calendar month per asset', async () => {
        const previousMonth = recentDayInMonthsAgo(1);
        const currentMonth = recentDayInMonthsAgo(0);
        setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
        binanceStub.earnRewards([
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: previousMonth }),
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: previousMonth + 5 * DAY_MS }),
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: currentMonth })
        ]);

        await binanceSyncService.sync();

        const transactions = fetchBinanceTransactions();
        const externalIds = transactions.map(transaction => transaction.externalId).sort();
        expect(externalIds).toStrictEqual(
            [`binance:earn:USDT:${buildEarnMonthKey(previousMonth)}`, `binance:earn:USDT:${buildEarnMonthKey(currentMonth)}`].sort()
        );
    });

    it('does not create duplicate Earn reward transactions on a second sync run', async () => {
        const rewardTime = recentDayInMonthsAgo(0);
        setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
        binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: rewardTime })]);

        await binanceSyncService.sync();
        expect(fetchBinanceTransactions()).toHaveLength(1);

        resetBinanceSyncForResync();
        binanceStub.earnRewards([buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: rewardTime })]);
        await binanceSyncService.sync();

        expect(fetchBinanceTransactions()).toHaveLength(1);
    });
});
