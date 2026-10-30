import { AccountBalanceRepository, AccountRepository, PRECISION, SyncModeEnum } from '@budgie/contracts';
import { BinanceHistorySourceEnum, BinanceSignedClient, BinanceSyncService, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { binanceStub, buildBinance, fetchBinanceTransactions, seedCryptoInstrument, setupBinanceFixture, TestLayer } from '../../harness';

const HOUR_MS = 60 * 60 * 1000;
const FUNDING_WALLET_TYPE = 1;
const CAPITAL_FROM_UNIX = Math.floor((Date.now() - 30 * 24 * HOUR_MS) / 1000);
const USDT_FUNDING_ID = encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' });
const USDT_SPOT_ID = encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'USDT' });

const fetchLedgerBalanceByExternalId = (externalId: string) =>
    Effect.gen(function* () {
        const accountRepository = yield* AccountRepository;
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const [account] = yield* accountRepository.findByExternalIds([externalId]);

        return (yield* accountBalanceRepository.getLedgerBalances([account.id])).get(account.id) ?? 0;
    });

describe('binance/wallet-routing', () => {
    it.effect('keeps Funding and Spot ledgers correct after a P2P buy, a transfer to Spot and a BTC buy', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const now = Date.now();

            yield* seedCryptoInstrument('BTC');
            yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BTC', free: '0.01' })]);
            binanceStub.c2cOrders(
                [
                    buildBinance.c2cOrder({
                        orderNumber: 'p2p-500',
                        tradeType: 'BUY',
                        asset: 'USDT',
                        amount: '500',
                        createTime: now - 3 * HOUR_MS
                    })
                ],
                []
            );
            binanceStub.universalTransfers([
                buildBinance.universalTransfer({
                    asset: 'USDT',
                    amount: '500',
                    type: 'FUNDING_MAIN',
                    tranId: 9001,
                    timestamp: now - 2 * HOUR_MS
                })
            ]);
            binanceStub.myTrades({
                BTCUSDT: [
                    buildBinance.trade({ symbol: 'BTCUSDT', id: 1, qty: '0.01', quoteQty: '500', isBuyer: true, time: now - HOUR_MS })
                ]
            });

            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions()).toHaveLength(3);
            expect(yield* fetchLedgerBalanceByExternalId(USDT_FUNDING_ID)).toBe(0);
            expect(yield* fetchLedgerBalanceByExternalId(USDT_SPOT_ID)).toBe(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books a Spot to Funding transfer as an outflow from Spot and an inflow to Funding', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;

            yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '75' })]);
            binanceStub.deposits([
                buildBinance.deposit({ id: 'dep-routing', coin: 'USDT', amount: '100', insertTime: Date.now() - 2 * HOUR_MS })
            ]);
            binanceStub.universalTransfers([
                buildBinance.universalTransfer({
                    asset: 'USDT',
                    amount: '25',
                    type: 'MAIN_FUNDING',
                    tranId: 9002,
                    timestamp: Date.now() - HOUR_MS
                })
            ]);

            yield* binanceSyncService.sync();

            expect(yield* fetchLedgerBalanceByExternalId(USDT_SPOT_ID)).toBe(75 * PRECISION);
            expect(yield* fetchLedgerBalanceByExternalId(USDT_FUNDING_ID)).toBe(25 * PRECISION);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { walletOverrides: { walletType: FUNDING_WALLET_TYPE }, expectedAccountId: USDT_FUNDING_ID },
        { walletOverrides: {}, expectedAccountId: USDT_SPOT_ID }
    ])('books a deposit with $walletOverrides to $expectedAccountId', ({ walletOverrides, expectedAccountId }) =>
        Effect.gen(function* () {
            const { token } = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.deposits([buildBinance.deposit({ id: 'dep-wallet', coin: 'USDT', amount: '10', ...walletOverrides })]);

            const transactions = yield* new BinanceSignedClient(token).getTransactions(BinanceHistorySourceEnum.CAPITAL, CAPITAL_FROM_UNIX);

            expect(transactions.map(transaction => transaction.accountId)).toEqual([expectedAccountId]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('counts frozen funds in the anchored balance', () =>
        Effect.gen(function* () {
            const { token } = yield* setupBinanceFixture({ asset: 'USDT', mode: SyncModeEnum.FORWARD });
            binanceStub.spotBalances([buildBinance.balance({ asset: 'USDT', free: '1', locked: '2', freeze: '4' })]);
            binanceStub.fundingBalances([buildBinance.balance({ asset: 'USDT', free: '10', freeze: '5' })]);

            const accounts = yield* new BinanceSignedClient(token).getAccounts();

            expect(accounts.map(account => [account.id, account.balance])).toEqual([
                [USDT_SPOT_ID, 7],
                [USDT_FUNDING_ID, 15]
            ]);
        }).pipe(Effect.provide(TestLayer))
    );
});
