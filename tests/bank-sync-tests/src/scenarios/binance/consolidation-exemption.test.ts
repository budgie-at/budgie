import { binanceSyncService } from '@app/sync/service/binance-sync.service';
import { transferPairRepository } from '@app/@generic/drizzle/db/db';
import { ExternalSourceEnum, InstrumentTypeEnum, PRECISION, TransactionEntityTable, TransactionTypeEnum } from '@budgie/contracts';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';

import { binanceStub, buildBinance, seed, seedAmountTransferPair, setupBinanceFixture, testDb } from '../../harness';

const fetchBinanceTransfers = () =>
    testDb
        .select()
        .from(TransactionEntityTable)
        .where(eq(TransactionEntityTable.externalSource, ExternalSourceEnum.BINANCE))
        .all()
        .filter(transaction => transaction.type === TransactionTypeEnum.TRANSFER);

describe('binance/consolidation-exemption', () => {
    it('does not surface a synced Binance TRANSFER as a transfer-pair candidate', async () => {
        seedAmountTransferPair(50 * PRECISION);

        seed.instrument({ code: 'ADA', name: 'ADA', symbol: 'ADA', type: InstrumentTypeEnum.CRYPTO });
        setupBinanceFixture({ asset: 'USDT' });
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: 'ADA', free: '200' })
        ]);
        binanceStub.myTrades({
            ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 90, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })]
        });

        await binanceSyncService.sync();

        const binanceTransfers = fetchBinanceTransfers();
        expect(binanceTransfers).toHaveLength(1);
        const transferTransactionId = binanceTransfers[0].id;

        const candidates = await transferPairRepository.findCandidates();

        expect(candidates.length).toBeGreaterThan(0);
        const referencesTransfer = candidates.some(
            candidate => candidate.expenseTransactionId === transferTransactionId || candidate.incomeTransactionId === transferTransactionId
        );
        expect(referencesTransfer).toBe(false);
    });
});
