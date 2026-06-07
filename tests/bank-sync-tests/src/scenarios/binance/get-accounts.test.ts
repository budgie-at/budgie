import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/bank-sync';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance } from '../../harness';

const TOKEN = JSON.stringify({ apiKey: 'k', apiSecret: 's' });

describe('binance/get-accounts', () => {
    it('enumerates Spot and Funding non-zero (wallet, asset) pairs', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '1' }), buildBinance.balance({ asset: 'ETH', free: '0' })]);
        binanceStub.fundingBalances([buildBinance.balance({ asset: 'USDT', free: '500' })]);
        binanceStub.earnPositions([]);
        binanceStub.lockedEarnPositions([]);

        const client = new BinanceSignedClient(TOKEN);
        const result = await client.getAccounts();

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

        const client = new BinanceSignedClient(TOKEN);
        const result = await client.getAccounts();

        expect(result.success).toBe(true);
        if (result.success) {
            const bnbAccount = result.data.find(account => account.currencyCode === 'BNB');
            expect(bnbAccount?.balance).toBeCloseTo(0.788412, 5);
        }
    });

    it('parks an asset whose microunit balance would exceed MAX_SAFE_INTEGER', async () => {
        binanceStub.serverTime();
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'PEPE', free: '99999999999' }),
            buildBinance.balance({ asset: 'BTC', free: '1' })
        ]);
        binanceStub.fundingBalances([]);
        binanceStub.earnPositions([]);
        binanceStub.lockedEarnPositions([]);

        const client = new BinanceSignedClient(TOKEN);
        const result = await client.getAccounts();

        expect(result.success).toBe(true);
        if (result.success) {
            const codes = result.data.map(account => account.currencyCode);
            expect(codes).toContain('BTC');
            expect(codes).not.toContain('PEPE');
        }
    });
});
