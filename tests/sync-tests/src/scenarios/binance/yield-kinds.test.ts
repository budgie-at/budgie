import { INVESTMENTS_CATEGORY_ID, TransactionEntityTable, TransactionEntryEntityTable, YieldKindEnum } from '@budgie/contracts';
import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import {
    binanceStub,
    buildBinance,
    buildEarnDayKey,
    recentDayInMonthsAgo,
    seedCryptoInstrument,
    setupUsdtSpotFixtureWithBalances,
    testDb,
    TestLayer
} from '../../harness';

import type { BinanceDividendApiInterface } from '@budgie/sync';

const HOUR_MS = 3_600_000;

const readYield = (externalId: string) =>
    testDb
        .select({ yieldKind: TransactionEntityTable.yieldKind, categoryId: TransactionEntryEntityTable.categoryId })
        .from(TransactionEntityTable)
        .innerJoin(TransactionEntryEntityTable, eq(TransactionEntryEntityTable.transactionId, TransactionEntityTable.id))
        .where(eq(TransactionEntityTable.externalId, externalId))
        .pipe(Effect.map(([row]) => row));

const syncDividends = (asset: string, dividends: BinanceDividendApiInterface[]) =>
    Effect.gen(function* () {
        const binanceSyncService = yield* BinanceSyncService;

        yield* seedCryptoInstrument(asset);
        yield* setupUsdtSpotFixtureWithBalances(asset, '1');
        binanceStub.dividends(dividends);
        yield* binanceSyncService.sync();
    });

describe('binance/yield-kinds', () => {
    it.effect('tags locked Earn rewards as EARN in the Investments category', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dayStartMs = recentDayInMonthsAgo(1);

            yield* seedCryptoInstrument('USDT');
            yield* setupUsdtSpotFixtureWithBalances('USDT', '1');
            binanceStub.lockedEarnRewards([buildBinance.lockedEarnReward({ asset: 'USDT', amount: '0.5', time: dayStartMs + HOUR_MS })]);
            yield* binanceSyncService.sync();

            expect(yield* readYield(`binance:earn-locked:USDT:${buildEarnDayKey(dayStartMs)}`)).toEqual({
                yieldKind: YieldKindEnum.EARN,
                categoryId: INVESTMENTS_CATEGORY_ID
            });
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect('tags ETH staking rewards as STAKING', () =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const dayStartMs = recentDayInMonthsAgo(1);

            yield* seedCryptoInstrument('BETH');
            yield* setupUsdtSpotFixtureWithBalances('BETH', '1');
            binanceStub.ethStakingRewards([buildBinance.stakingReward({ asset: 'BETH', amount: '0.5', time: dayStartMs + HOUR_MS })]);
            yield* binanceSyncService.sync();

            expect((yield* readYield(`binance:eth-staking:BETH:${buildEarnDayKey(dayStartMs)}`)).yieldKind).toBe(YieldKindEnum.STAKING);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each([
        { enInfo: 'ETH 2.0 Staking', yieldKind: YieldKindEnum.STAKING },
        { enInfo: 'DeFi Staking', yieldKind: YieldKindEnum.STAKING },
        { enInfo: 'BNB Vault', yieldKind: YieldKindEnum.EARN },
        { enInfo: 'Simple Earn Locked Rewards', yieldKind: YieldKindEnum.EARN },
        { enInfo: 'Launchpool', yieldKind: YieldKindEnum.DISTRIBUTION },
        { enInfo: 'Megadrop', yieldKind: YieldKindEnum.DISTRIBUTION },
        { enInfo: 'HODLer Airdrops Distribution', yieldKind: YieldKindEnum.DISTRIBUTION },
        { enInfo: 'Simple Earn Flexible Airdrop', yieldKind: YieldKindEnum.DISTRIBUTION },
        { enInfo: 'Something new', yieldKind: YieldKindEnum.DISTRIBUTION }
    ])('tags a dividend with enInfo $enInfo as $yieldKind', ({ enInfo, yieldKind }) =>
        Effect.gen(function* () {
            yield* syncDividends('BNB', [
                buildBinance.dividend({ tranId: 9301, asset: 'BNB', amount: '1.5', divTime: recentDayInMonthsAgo(1) + HOUR_MS, enInfo })
            ]);

            expect(yield* readYield('binance:dividend:9301')).toEqual({ yieldKind, categoryId: INVESTMENTS_CATEGORY_ID });
        }).pipe(Effect.provide(TestLayer))
    );
});
