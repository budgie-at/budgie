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

const CONVERT_MAPPING_ORDER_ID = 7001;
const CONVERT_FEE_ORDER_ID = 7002;
const CONVERT_NAMESPACE_ORDER_ID = 7003;
const CONVERT_RESYNC_ORDER_ID = 7004;

const stubUsdtToBtcConvert = (orderId: number): void => {
    binanceStub.convertTradeFlow([
        buildBinance.convertFlow({ orderId, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
    ]);
};

describe('binance/convert', () => {
    it('maps a Convert to a TRANSFER with from-out and to-in legs at exchangeRate 1', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        stubUsdtToBtcConvert(CONVERT_MAPPING_ORDER_ID);

        await binanceSyncService.sync();

        expectSingleBinanceTransaction(TransactionTypeEnum.TRANSFER, 'binance:convert:7001');
        expect(fetchBinanceTransactions()[0].exchangeRate).toBe(1);
        expect(fetchBinanceEntriesByExternalId('binance:convert:7001')).toHaveLength(2);
    });

    it('does not emit a FEE entry for a Convert (fee is baked into the rate)', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        stubUsdtToBtcConvert(CONVERT_FEE_ORDER_ID);

        await binanceSyncService.sync();

        expect(fetchBinanceEntriesByExternalId('binance:convert:7002:fee')).toHaveLength(0);
    });

    it('imports only successful Convert orders', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        binanceStub.convertTradeFlow([
            buildBinance.convertFlow({ orderId: 7101, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' }),
            buildBinance.convertFlow({
                orderId: 7102,
                fromAsset: 'USDT',
                fromAmount: '100',
                toAsset: 'BTC',
                toAmount: '0.001',
                orderStatus: 'FAILED'
            })
        ]);

        await binanceSyncService.sync();

        const externalIds = fetchBinanceTransactions().map(transaction => transaction.externalId);
        expect(externalIds).toEqual(['binance:convert:7101']);
    });

    it('does not collide with a spot-trade externalId namespace', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        binanceStub.myTrades({
            BTCUSDT: [
                buildBinance.trade({
                    symbol: 'BTCUSDT',
                    id: CONVERT_NAMESPACE_ORDER_ID,
                    qty: '0.002',
                    quoteQty: '200',
                    commission: '0',
                    isBuyer: true
                })
            ]
        });
        stubUsdtToBtcConvert(CONVERT_NAMESPACE_ORDER_ID);

        await binanceSyncService.sync();

        const externalIds = fetchBinanceTransactions()
            .map(transaction => transaction.externalId)
            .sort();
        expect(externalIds).toEqual(['binance:convert:7003', 'binance:trade:BTCUSDT:7003']);
    });

    it('does not create duplicate Convert transfers on a second sync run', async () => {
        seedCryptoInstrument('BTC');
        setupUsdtSpotFixtureWithBalances('BTC', '1');
        stubUsdtToBtcConvert(CONVERT_RESYNC_ORDER_ID);

        await binanceSyncService.sync();

        await expectNoDuplicateAfterResync(() => {
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'BTC', free: '1' })
            ]);
            stubUsdtToBtcConvert(CONVERT_RESYNC_ORDER_ID);
        });
    });
});
