import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    P2P_UAH_TOTAL,
    P2P_USDT_AMOUNT,
    expectConsolidatedToP2pCanonical,
    fetchP2pCanonical,
    fetchCanonicalsOfType,
    seedP2pFiatTransferFixture,
    seedP2pPair,
    TestLayer
} from '../../harness';

const consolidateExpectingSingleResult = Effect.fnUntraced(function* () {
    const transferConsolidationService = yield* TransferConsolidationService;
    const result = yield* transferConsolidationService.consolidate(null);

    expect(result).toEqual({ found: 1, consolidated: 1 });
});

describe('consolidation/binance-p2p-fiat-transfer basic directions', () => {
    it.effect('auto-consolidates a bank UAH expense with a Binance USDT P2P top-up income via a triangulated rate', () =>
        Effect.gen(function* () {
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const { expense, income } = yield* seedP2pPair(
                { externalId: 'mono-uah-p2p-out', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
                { externalId: 'binance:c2c:buy-1', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
            );

            yield* consolidateExpectingSingleResult();
            yield* expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, binanceAccount.id);
            expect((yield* fetchP2pCanonical()).title).toBe('Binance P2P buy USDT');
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('auto-consolidates a Binance USDT P2P sell expense with a bank UAH cash-out income', () =>
        Effect.gen(function* () {
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const { expense, income } = yield* seedP2pPair(
                { externalId: 'binance:c2c:sell-1', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT },
                { externalId: 'mono-uah-p2p-in', accountId: bankAccount.id, amount: P2P_UAH_TOTAL }
            );

            yield* consolidateExpectingSingleResult();
            yield* expectConsolidatedToP2pCanonical(expense, income, binanceAccount.id, bankAccount.id);
            expect((yield* fetchP2pCanonical()).title).toBe('Binance P2P sell USDT');
        }).pipe(Effect.provide(TestLayer))
    );
});

describe('consolidation/binance-p2p-fiat-transfer exchange support', () => {
    it.effect('consolidates a P2P top-up from any synced crypto exchange, not only Binance', () =>
        Effect.gen(function* () {
            const { bankAccount, binanceAccount: exchangeAccount } = yield* seedP2pFiatTransferFixture();
            const { expense, income } = yield* seedP2pPair(
                { externalId: 'mono-uah-okx-out', accountId: bankAccount.id, amount: P2P_UAH_TOTAL },
                { externalId: 'okx:c2c:buy-1', accountId: exchangeAccount.id, amount: P2P_USDT_AMOUNT }
            );

            yield* consolidateExpectingSingleResult();
            yield* expectConsolidatedToP2pCanonical(expense, income, bankAccount.id, exchangeAccount.id);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('does not consolidate a pair whose implied rate is far from the market rate', () =>
        Effect.gen(function* () {
            const { bankAccount, binanceAccount } = yield* seedP2pFiatTransferFixture();
            const offRateAmount = Number('8000') * PRECISION;
            yield* seedP2pPair(
                { externalId: 'mono-uah-off-rate', accountId: bankAccount.id, amount: offRateAmount },
                { externalId: 'binance:c2c:buy-off-rate', accountId: binanceAccount.id, amount: P2P_USDT_AMOUNT }
            );

            const transferConsolidationService = yield* TransferConsolidationService;
            const result = yield* transferConsolidationService.consolidate(null);

            expect(result.consolidated).toBe(0);
            expect(yield* fetchCanonicalsOfType(TransactionConsolidationTypeEnum.P2P_FIAT_TRANSFER)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );
});
