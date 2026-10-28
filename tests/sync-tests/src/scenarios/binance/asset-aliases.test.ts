import { AccountEntityTable, AccountTypeEnum, ExternalSourceEnum } from '@budgie/contracts';
import { BinanceSyncService, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq, or } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    fetchBinanceTransactions,
    seed,
    seedCryptoInstrument,
    setupBinanceFixture,
    testDb,
    TestLayer
} from '../../harness';

const TRADE_ID = 41;

const syncRenamedAssetTrade = (retiredAsset: string, currentAsset: string) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;
        const currentInstrument = yield* seedCryptoInstrument(currentAsset);
        yield* setupBinanceFixture({ asset: 'USDT' });
        const currentAccount = yield* seed.account({
            externalId: encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: currentAsset }),
            externalSource: ExternalSourceEnum.BINANCE,
            type: AccountTypeEnum.CRYPTO_SYNC,
            instrumentId: currentInstrument.id
        });
        const symbol = `${retiredAsset}USDT`;
        binanceStub.exchangeInfo([symbol]);
        binanceStub.spotBalances([
            buildBinance.balance({ asset: 'USDT', free: '100' }),
            buildBinance.balance({ asset: currentAsset, free: '200' })
        ]);
        binanceStub.myTrades({
            [symbol]: [buildBinance.trade({ symbol, id: TRADE_ID, qty: '200', quoteQty: '100', commission: '0', isBuyer: true })]
        });

        yield* binanceSyncService.sync();

        return currentAccount;
    });

const expectTradeOnCurrentAccount = (retiredAsset: string, currentAsset: string) =>
    Effect.gen(function* () {
        const currentAccount = yield* syncRenamedAssetTrade(retiredAsset, currentAsset);

        const accounts = yield* testDb
            .select()
            .from(AccountEntityTable)
            .where(
                or(eq(AccountEntityTable.externalId, `SPOT:${retiredAsset}`), eq(AccountEntityTable.externalId, `SPOT:${currentAsset}`))
            );
        const transactions = yield* fetchBinanceTransactions();

        expect(accounts.map(account => account.id)).toStrictEqual([currentAccount.id]);
        expect(transactions.map(transaction => transaction.externalId)).toStrictEqual([`binance:trade:${retiredAsset}USDT:${TRADE_ID}`]);
        expect(transactions[0].toAccountId).toBe(currentAccount.id);
    });

describe('binance/asset-aliases', () => {
    it.effect.each([
        { retiredAsset: 'MATIC', currentAsset: 'POL' },
        { retiredAsset: 'RNDR', currentAsset: 'RENDER' },
        { retiredAsset: 'FTM', currentAsset: 'S' }
    ])('lands historical $retiredAsset trades on the $currentAsset account without a duplicate', ({ retiredAsset, currentAsset }) =>
        expectTradeOnCurrentAccount(retiredAsset, currentAsset).pipe(Effect.provide(TestLayer))
    );
});
