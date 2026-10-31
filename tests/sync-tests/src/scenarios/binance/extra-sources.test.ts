import { TransactionTypeEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    buildEarnDayKey,
    expectSingleBinanceTransaction,
    fetchBinanceEntriesByExternalId,
    fetchSortedBinanceExternalIds,
    recentDayInMonthsAgo,
    seedCryptoInstrument,
    setupUsdtSpotFixtureWithBalances,
    TestLayer
} from '../../harness';

import type { BinanceDividendApiInterface } from '@budgie/sync';

const HOUR_MS = 3_600_000;
const MICRO_UNITS = 1_000_000;
const DUST_LOG_ID = 9001;
const DIVIDEND_TRAN_ID = 9101;
const DEBIT_TRAN_ID = 9102;

const rewardCases = [
    {
        name: 'locked Simple Earn rewards',
        asset: 'USDT',
        idPrefix: 'binance:earn-locked',
        stub: (firstTime: number, secondTime: number) => {
            binanceStub.lockedEarnRewards([
                buildBinance.lockedEarnReward({ asset: 'USDT', amount: '0.5', time: firstTime }),
                buildBinance.lockedEarnReward({ asset: 'USDT', amount: '0.25', time: secondTime })
            ]);
        }
    },
    {
        name: 'ETH staking rewards',
        asset: 'BETH',
        idPrefix: 'binance:eth-staking',
        stub: (firstTime: number, secondTime: number) => {
            binanceStub.ethStakingRewards([
                buildBinance.stakingReward({ asset: 'BETH', amount: '0.5', time: firstTime }),
                buildBinance.stakingReward({ asset: 'BETH', amount: '0.25', time: secondTime })
            ]);
        }
    }
];

const syncBnbDividends = (dividends: BinanceDividendApiInterface[]) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;
        yield* seedCryptoInstrument('BNB');
        yield* setupUsdtSpotFixtureWithBalances('BNB', '1');
        binanceStub.dividends(dividends);

        yield* binanceSyncService.sync();
    });

describe('binance/extra-sources', () => {
    for (const rewardCase of rewardCases) {
        it.effect(`books ${rewardCase.name} as one income per day`, () =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;
                const dayStartMs = recentDayInMonthsAgo(1);
                const externalId = `${rewardCase.idPrefix}:${rewardCase.asset}:${buildEarnDayKey(dayStartMs)}`;
                yield* seedCryptoInstrument(rewardCase.asset);
                yield* setupUsdtSpotFixtureWithBalances(rewardCase.asset, '1');
                rewardCase.stub(dayStartMs + HOUR_MS, dayStartMs + 5 * HOUR_MS);

                yield* binanceSyncService.sync();

                yield* expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, externalId);
                const entries = yield* fetchBinanceEntriesByExternalId(externalId);
                expect(entries).toHaveLength(1);
                expect(entries[0].amount).toBe((MICRO_UNITS * 3) / 4);
            }).pipe(Effect.provide(TestLayer))
        );
    }

    it.effect('does not book simple earn interest dividends already synced from earn rewards', () =>
        Effect.gen(function* () {
            const dividendTime = recentDayInMonthsAgo(1) + HOUR_MS;

            yield* syncBnbDividends([
                buildBinance.dividend({
                    tranId: DIVIDEND_TRAN_ID,
                    asset: 'BNB',
                    amount: '1.5',
                    divTime: dividendTime,
                    enInfo: 'Flexible Interest'
                }),
                buildBinance.dividend({
                    tranId: DEBIT_TRAN_ID,
                    asset: 'BNB',
                    amount: '0.2',
                    divTime: dividendTime,
                    enInfo: 'Locked Savings'
                })
            ]);

            expect(yield* fetchBinanceEntriesByExternalId(`binance:dividend:${DIVIDEND_TRAN_ID}`)).toHaveLength(0);
            expect(yield* fetchBinanceEntriesByExternalId(`binance:dividend:${DEBIT_TRAN_ID}`)).toHaveLength(0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books a dividend as income and ignores debited rows', () =>
        Effect.gen(function* () {
            const dividendTime = recentDayInMonthsAgo(1) + HOUR_MS;

            yield* syncBnbDividends([
                buildBinance.dividend({ tranId: DIVIDEND_TRAN_ID, asset: 'BNB', amount: '1.5', divTime: dividendTime }),
                buildBinance.dividend({ tranId: DEBIT_TRAN_ID, asset: 'BNB', amount: '0.2', divTime: dividendTime, direction: -1 })
            ]);

            yield* expectSingleBinanceTransaction(TransactionTypeEnum.INCOME, `binance:dividend:${DIVIDEND_TRAN_ID}`);
            const entries = yield* fetchBinanceEntriesByExternalId(`binance:dividend:${DIVIDEND_TRAN_ID}`);
            expect(entries[0].amount).toBe(1_500_000);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('books a dust conversion as one transfer per asset into BNB with the service charge as a fee', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const operateTime = recentDayInMonthsAgo(1) + HOUR_MS;
            yield* seedCryptoInstrument('BNB');
            yield* seedCryptoInstrument('ADA');
            yield* setupUsdtSpotFixtureWithBalances('BNB', '1');
            binanceStub.spotBalances([
                buildBinance.balance({ asset: 'USDT', free: '100' }),
                buildBinance.balance({ asset: 'BNB', free: '1' }),
                buildBinance.balance({ asset: 'ADA', free: '1' })
            ]);
            binanceStub.dustLogs([
                buildBinance.dustLog({
                    operateTime,
                    transId: DUST_LOG_ID,
                    totalTransferedAmount: '0.0105',
                    totalServiceChargeAmount: '0.00021',
                    userAssetDribbletDetails: [
                        {
                            transId: 1,
                            fromAsset: 'ADA',
                            targetAsset: 'BNB',
                            amount: '0.5',
                            transferedAmount: '0.01',
                            serviceChargeAmount: '0.0002',
                            operateTime
                        },
                        {
                            transId: 2,
                            fromAsset: 'USDT',
                            targetAsset: 'BNB',
                            amount: '0.3',
                            transferedAmount: '0.0005',
                            serviceChargeAmount: '0.00001',
                            operateTime
                        }
                    ]
                })
            ]);

            yield* binanceSyncService.sync();

            expect(yield* fetchSortedBinanceExternalIds()).toEqual([`binance:dust:${DUST_LOG_ID}:ADA`, `binance:dust:${DUST_LOG_ID}:USDT`]);
            const adaFee = yield* fetchBinanceEntriesByExternalId(`binance:dust:${DUST_LOG_ID}:ADA:fee`);
            const usdtFee = yield* fetchBinanceEntriesByExternalId(`binance:dust:${DUST_LOG_ID}:USDT:fee`);
            expect(adaFee.map(entry => entry.amount)).toEqual([200]);
            expect(usdtFee.map(entry => entry.amount)).toEqual([10]);
            const adaLegs = yield* fetchBinanceEntriesByExternalId(`binance:dust:${DUST_LOG_ID}:ADA`);
            expect(adaLegs.map(entry => entry.amount).sort((left, right) => left - right)).toEqual([10_000, 500_000]);
        }).pipe(Effect.provide(TestLayer))
    );
});
