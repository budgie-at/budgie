import { BinanceWalletEnum, decodeBinanceAccountId, encodeBinanceAccountId } from '@budgie/bank-sync';
import { describe, expect, it } from 'vitest';

describe('binance/account-id-codec', () => {
    it('round-trips an encoded (wallet, asset) accountId', () => {
        const encoded = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'BTC' });

        expect(encoded).toBe('SPOT:BTC');
        expect(decodeBinanceAccountId(encoded)).toEqual({ wallet: BinanceWalletEnum.SPOT, asset: 'BTC' });
    });

    it('round-trips the FUNDING wallet', () => {
        const encoded = encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'ETH' });

        expect(decodeBinanceAccountId(encoded)).toEqual({ wallet: BinanceWalletEnum.FUNDING, asset: 'ETH' });
    });

    it('rejects an unknown wallet tag', () => {
        expect(decodeBinanceAccountId('MARGIN:BTC')).toBeNull();
    });

    it('rejects a malformed id without a separator', () => {
        expect(decodeBinanceAccountId('BTC')).toBeNull();
    });

    it('rejects an id with an empty asset', () => {
        expect(decodeBinanceAccountId('SPOT:')).toBeNull();
    });
});
