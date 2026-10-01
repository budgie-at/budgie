import { BinanceSyncService } from '@app/sync/service/binance-sync.service';
import { TransferPairRepository } from '@budgie/consolidation';
import { PRECISION, TransactionTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    seedAmountTransferPair,
    seedCryptoInstrument,
    setupUsdtSpotFixtureWithBalances,
    TestLayer
} from '../../harness';

const fetchBinanceTransfers = () =>
    Effect.gen(function* () {
        return (yield* fetchBinanceTransactions()).filter(transaction => transaction.type === TransactionTypeEnum.TRANSFER);
    });

describe('binance/consolidation-exemption', () => {
    it.effect('does not surface a synced Binance TRANSFER as a transfer-pair candidate', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const transferPairRepository = yield* TransferPairRepository;

            yield* seedAmountTransferPair(50 * PRECISION);

            yield* seedCryptoInstrument('ADA');
            yield* setupUsdtSpotFixtureWithBalances('ADA', '200');
            binanceStub.myTrades({
                ADAUSDT: [buildBinance.trade({ symbol: 'ADAUSDT', id: 90, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })]
            });

            yield* binanceSyncService.sync();

            const binanceTransfers = yield* fetchBinanceTransfers();
            expect(binanceTransfers).toHaveLength(1);
            const transferTransactionId = binanceTransfers[0].id;

            const candidates = yield* transferPairRepository.findCandidates();

            expect(candidates.length).toBeGreaterThan(0);
            const referencesTransfer = candidates.some(
                candidate =>
                    candidate.expenseTransactionId === transferTransactionId || candidate.incomeTransactionId === transferTransactionId
            );
            expect(referencesTransfer).toBe(false);
        }).pipe(Effect.provide(Layer.provideMerge(TransferPairRepository.layer, TestLayer)))
    );
});
