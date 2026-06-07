import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import {
    ExternalSourceEnum,
    InstrumentTypeEnum,
    TransactionEntityTable,
    TransactionEntryEntityTable,
    TransactionTypeEnum
} from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, seed, setupBinanceFixture, testDb } from '../../harness';

const fetchTransactions = () =>
    testDb.select().from(TransactionEntityTable).where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE)).all();

const fetchEntriesByExternalId = (externalId: string) =>
    testDb.select().from(TransactionEntryEntityTable).where(eq(TransactionEntryEntityTable.externalId, externalId)).all();

const seedInstrument = (code: string) => seed.instrument({ code, name: code, symbol: code, type: InstrumentTypeEnum.CRYPTO });

describe('binance/convert', () => {
    it('maps a Convert to a TRANSFER with from-out and to-in legs at exchangeRate 1', async () => {
        seedInstrument('BTC');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'BTC', free: '1' })]);
        binanceStub.convertTradeFlow([
            buildBinance.convertFlow({ orderId: 7001, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
        ]);

        await binanceSyncService.sync();

        const transactions = fetchTransactions();
        expect(transactions).toHaveLength(1);
        expect(transactions[0].type).toBe(TransactionTypeEnum.TRANSFER);
        expect(transactions[0].externalId).toBe('binance:convert:7001');
        expect(transactions[0].exchangeRate).toBe(1);

        const entries = fetchEntriesByExternalId('binance:convert:7001');
        expect(entries).toHaveLength(2);
    });

    it('does not emit a FEE entry for a Convert (fee is baked into the rate)', async () => {
        seedInstrument('BTC');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'BTC', free: '1' })]);
        binanceStub.convertTradeFlow([
            buildBinance.convertFlow({ orderId: 7002, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
        ]);

        await binanceSyncService.sync();

        expect(fetchEntriesByExternalId('binance:convert:7002:fee')).toHaveLength(0);
    });

    it('does not collide with a spot-trade externalId namespace', async () => {
        seedInstrument('BTC');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'BTC', free: '1' })]);
        binanceStub.myTrades({
            BTCUSDT: [buildBinance.trade({ symbol: 'BTCUSDT', id: 7003, qty: '0.002', quoteQty: '200', commission: '0', isBuyer: true })]
        });
        binanceStub.convertTradeFlow([
            buildBinance.convertFlow({ orderId: 7003, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
        ]);

        await binanceSyncService.sync();

        const externalIds = fetchTransactions()
            .map(transaction => transaction.externalId)
            .sort();
        expect(externalIds).toEqual(['binance:convert:7003', 'binance:trade:BTCUSDT:7003']);
    });

    it('does not create duplicate Convert transfers on a second sync run', async () => {
        seedInstrument('BTC');
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'BTC', free: '1' })]);
        binanceStub.convertTradeFlow([
            buildBinance.convertFlow({ orderId: 7004, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
        ]);

        await binanceSyncService.sync();
        expect(fetchTransactions()).toHaveLength(1);

        Object.assign(binanceSyncService, { isRunning: false });
        binanceStub.serverTime();
        binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '100' }), buildBinance.balance({ asset: 'BTC', free: '1' })]);
        binanceStub.convertTradeFlow([
            buildBinance.convertFlow({ orderId: 7004, fromAsset: 'USDT', fromAmount: '100', toAsset: 'BTC', toAmount: '0.001' })
        ]);
        await binanceSyncService.sync();

        expect(fetchTransactions()).toHaveLength(1);
    });
});
