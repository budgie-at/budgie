import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    binanceStub,
    buildBinance,
    expectNoDuplicateAfterResync,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchBinanceTransactions,
    seedCryptoInstrument,
    setupUsdtSpotFixtureWithBalances
} from '../../harness';

const stubUsdtToBtcConvert = (orderId: number): void => {
    binanceStub.convertTradeFlow([
        buildBinance.convertFlow({ orderId, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
    ]);
};

describe('binance/convert', () => {
    it('maps a Convert to a TRANSFER with from-out and to-in legs at exchangeRate 1', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        stubUsdtToBtcConvert(7001);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.TRANSFER, 'binance:convert:7001');
        expect(fetchBinanceTransactions()[0].exchangeRate).toBe(1);
        expect(fetchBinanceEntriesByExternalId('binance:convert:7001')).toHaveLength(2);
    });

    it('does not emit a FEE entry for a Convert (fee is baked into the rate)', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        stubUsdtToBtcConvert(7002);

        await binanceSyncService.sync();

        expect(fetchBinanceEntriesByExternalId('binance:convert:7002:fee')).toHaveLength(0);
    });

    it('does not collide with a spot-trade externalId namespace', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        binanceStub.myTrades({
            BTCUSDT: [buildBinance.trade({ symbol: 'BTCUSDT', id: 7003, qty: '0.002', quoteQty: '200', commission: '0', isBuyer: true })]
        });
        stubUsdtToBtcConvert(7003);

        await binanceSyncService.sync();

        const externalIds = fetchBinanceTransactions()
            .map(transaction => transaction.externalId)
            .sort();
        expect(externalIds).toEqual(['binance:convert:7003', 'binance:trade:BTCUSDT:7003']);
    });

    it('does not create duplicate Convert transfers on a second sync run', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        stubUsdtToBtcConvert(7004);

        await binanceSyncService.sync();

        await expectNoDuplicateAfterResync(() => {
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'BTC', free: '1' })
            ]);
            stubUsdtToBtcConvert(7004);
        });
    });
});
