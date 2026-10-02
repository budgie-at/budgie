import { BinanceSignedClient, BinanceWalletEnum, encodeBinanceAccountId } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { BINANCE_TEST_TOKEN, binanceStub, buildBinance, TestLayer } from '../../harness';

const BNB_EARN_TOTAL_BALANCE = 0.788412;

const fetchAccounts = () => new BinanceSignedClient(BINANCE_TEST_TOKEN).getAccounts();

describe('binance/get-accounts', () => {
    it.effect('enumerates Spot and Funding non-zero (wallet, asset) pairs', () =>
        Effect.gen(function* () {
            binanceStub.serverTime();
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'BTC', free: '1' }),
                buildBinance.balance({ asset: 'ETH', free: '0' })
            ]);
            binanceStub.fundingBalances([buildBinance.balance({ asset: 'USDT', free: '500' })]);
            binanceStub.earnPositions([]);
            binanceStub.lockedEarnPositions([]);

            const accounts = yield* fetchAccounts();

            const ids = accounts.map(account => account.id).sort();
            expect(ids).toEqual([
                encodeBinanceAccountId({ wallet: BinanceWalletEnum.FUNDING, asset: 'USDT' }),
                encodeBinanceAccountId({ wallet: BinanceWalletEnum.SPOT, asset: 'BTC' })
            ]);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('folds flexible and locked Simple Earn principal into the spot asset balance', () =>
        Effect.gen(function* () {
            binanceStub.serverTime();
            binanceStub.spotBalances([buildBinance.balance({ asset: 'BNB', free: '0.27799219' })]);
            binanceStub.fundingBalances([]);
            binanceStub.earnPositions([buildBinance.earnPosition({ asset: 'BNB', totalAmount: '0.00008945' })]);
            binanceStub.lockedEarnPositions([buildBinance.lockedEarnPosition({ asset: 'BNB', amount: '0.51033101' })]);

            const accounts = yield* fetchAccounts();

            const bnbAccount = accounts.find(account => account.currencyCode === 'BNB');
            expect(bnbAccount?.balance).toBeCloseTo(BNB_EARN_TOTAL_BALANCE, 5);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('marks an asset whose microunit balance would exceed MAX_SAFE_INTEGER as balance-unrepresentable', () =>
        Effect.gen(function* () {
            binanceStub.serverTime();
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'PEPE', free: '99999999999' }),
                buildBinance.balance({ asset: 'BTC', free: '1' })
            ]);
            binanceStub.fundingBalances([]);
            binanceStub.earnPositions([]);
            binanceStub.lockedEarnPositions([]);

            const accounts = yield* fetchAccounts();

            const btcAccount = accounts.find(account => account.currencyCode === 'BTC');
            const pepeAccount = accounts.find(account => account.currencyCode === 'PEPE');
            expect(btcAccount?.balanceState).toBe('REPRESENTABLE');
            expect(pepeAccount?.balanceState).toBe('UNREPRESENTABLE');
        }).pipe(Effect.provide(TestLayer))
    );
});
