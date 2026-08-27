import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from 'vitest';

import { BINANCE_TEST_TOKEN, binanceStub, buildBinance } from '../../harness';

import type { SyncAccountInterface, SyncResultInterface } from '@budgie/sync';

const BNB_EARN_TOTAL_BALANCE = 0.788412;

const fetchAccountsResult = (): Promise<SyncResultInterface<SyncAccountInterface[]>> =>
    new BinanceSignedClient(BINANCE_TEST_TOKEN).getAccounts();

describe('binance/get-accounts', () => {
    it('enumerates Spot and Funding non-zero (wallet, asset) pairs', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' }), buildBinance.balance({ asset: 'ETH', free: '0' })]);
        binanceStub.fundingBalances([buildBinance.balance({ asset: 'USDT', free: '500' })]);
        binanceStub.earnPositions([]);
        binanceStub.lockedEarnPositions([]);

        const result = await fetchAccountsResult();

        expect(result.success).toBe(true);
        if (result.success) {
            const ids = result.data.map(account => account.id).sort();
            expect(ids).toEqual([
                encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' }),
                encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'BTC' })
            ]);
        }
    });

    it('folds flexible and locked Simple Earn principal into the spot asset balance', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'BNB', free: '0.27799219' })]);
        binanceStub.fundingBalances([]);
        binanceStub.earnPositions([buildBinance.earnPosition({ asset: 'BNB', totalAmount: '0.00008945' })]);
        binanceStub.lockedEarnPositions([buildBinance.lockedEarnPosition({ asset: 'BNB', amount: '0.51033101' })]);

        const result = await fetchAccountsResult();

        expect(result.success).toBe(true);
        if (result.success) {
            const bnbAccount = result.data.find(account => account.currencyCode === 'BNB');
            expect(bnbAccount?.balance).toBeCloseTo(BNB_EARN_TOTAL_BALANCE, 5);
        }
    });

    it('marks an asset whose microunit balance would exceed MAX_SAFE_INTEGER as balance-unrepresentable', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'PEPE', free: '99999999999' }),
            buildBinance.balance({ asset: 'BTC', free: '1' })
        ]);
        binanceStub.fundingBalances([]);
        binanceStub.earnPositions([]);
        binanceStub.lockedEarnPositions([]);

        const result = await fetchAccountsResult();

        expect(result.success).toBe(true);
        if (result.success) {
            const btcAccount = result.data.find(account => account.currencyCode === 'BTC');
            const pepeAccount = result.data.find(account => account.currencyCode === 'PEPE');
            expect(btcAccount?.balanceState).toBe('REPRESENTABLE');
            expect(pepeAccount?.balanceState).toBe('UNREPRESENTABLE');
        }
    });
});
