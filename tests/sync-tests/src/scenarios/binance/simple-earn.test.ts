import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { SyncModeEnum } from '@budgie/contracts';
import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from 'vitest';

import {
    BINANCE_TEST_TOKEN,
    binanceStub,
    buildBinance,
    buildEarnDayKey,
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
            [buildBinance.earnPosition({ asset: '1INCH', totalAmount: '5' })]
        );

        const oneInchAccounts = accounts.filter(account => account.currencyCode === '1INCH');
        expect(oneInchAccounts).toHaveLength(1);
        expect(oneInchAccounts[0].id).toBe(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: '1INCH' }));
        expect(oneInchAccounts[0].balance).toBe(15);
    });

    it('folds Earn into an asset held only in Earn (no spot balance)', async () => {
        const accounts = await fetchFoldedAccounts([], [buildBinance.earnPosition({ asset: 'USDT', totalAmount: '40' })]);

        const usdtAccounts = accounts.filter(account => account.currencyCode === 'USDT');
        expect(usdtAccounts).toHaveLength(1);
        expect(usdtAccounts[0].balance).toBe(40);
    });

    it('preserves an LDO Earn asset code instead of stripping its LD prefix', async () => {
        const accounts = await fetchFoldedAccounts([], [buildBinance.earnPosition({ asset: 'LDO', totalAmount: '3' })]);

        expect(accounts.map(account => account.currencyCode)).toStrictEqual(['LDO']);
        expect(accounts[0].id).toBe(encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'LDO' }));
    });

    it('parks an asset whose post-fold balance exceeds MAX_SAFE_INTEGER', async () => {
        const accounts = await fetchFoldedAccounts(
            [buildBinance.balance({ asset: 'PEPE', free: '9000000000' })],
            [buildBinance.earnPosition({ asset: 'PEPE', totalAmount: '900000000' })]
        );

        const pepeAccount = accounts.find(account => account.currencyCode === 'PEPE');
        expect(pepeAccount?.balanceState).toBe('UNREPRESENTABLE');
    });

    it('emits one Earn transaction per reward day so later same-month rewards import', async () => {
        const monthStart = recentDayInMonthsAgo(1);
        const firstReward = monthStart;
        const lastReward = monthStart + 5 * DAY_MS;
        setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
        binanceStub.earnRewards([
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.5', time: firstReward }),
            buildBinance.earnReward({ asset: 'USDT', rewards: '0.25', time: lastReward })
        ]);

        await binanceSyncService.sync();

        const externalIds = fetchBinanceTransactions()
            .map(transaction => transaction.externalId)
            .sort();
        expect(externalIds).toStrictEqual(
            [`binance:earn:USDT:${buildEarnDayKey(firstReward)}`, `binance:earn:USDT:${buildEarnDayKey(lastReward)}`].sort()
        );
    });

    it('emits one Earn transaction per calendar day per asset', async () => {
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
            [
                `binance:earn:USDT:${buildEarnDayKey(previousMonth)}`,
                `binance:earn:USDT:${buildEarnDayKey(previousMonth + 5 * DAY_MS)}`,
                `binance:earn:USDT:${buildEarnDayKey(currentMonth)}`
            ].sort()
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
