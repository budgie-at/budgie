import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceErrorResponse,
    binanceStub,
    buildBinance,
    expectSyncFailedAndDisabled,
    fetchBinanceTransactions,
    fetchHistoryProgress,
    resyncBinance,
    setupBinanceFixture,
    stubEmptyBinanceBalances,
    TestLayer
} from '../../harness';

const OPTIONAL_ENDPOINTS = [
    'lockedEarnRewards',
    'ethStakingRewards',
    'solStakingRewards',
    'dividends',
    'dustLogs',
    'universalTransfers'
] as const;

const PRODUCT_ERRORS = [
    { label: 'a product-not-enabled API error', respond: () => binanceErrorResponse.apiError(-9000, 'Product is not enabled.') },
    { label: 'a 451 region block', respond: binanceErrorResponse.regionBlocked }
];

const DAY_MS = 86_400_000;
const OLD_ROW_AGE_MS = 100 * DAY_MS;

const BACKFILLED_SOURCES = [
    {
        key: 'LOCKED_EARN',
        endpoint: 'lockedEarnRewards',
        respond: () => binanceErrorResponse.apiError(-9000, 'Product is not enabled.'),
        stub: (timeMs: number) =>
            binanceStub.lockedEarnRewards([buildBinance.lockedEarnReward({ asset: 'USDT', amount: '1', time: timeMs })])
    },
    {
        key: 'DIVIDEND',
        endpoint: 'dividends',
        respond: binanceErrorResponse.regionBlocked,
        stub: (timeMs: number) =>
            binanceStub.dividends([buildBinance.dividend({ tranId: 7001, asset: 'USDT', amount: '1', divTime: timeMs })])
    },
    {
        key: 'CONVERT',
        endpoint: 'universalTransfers',
        respond: () => binanceErrorResponse.apiError(-9000, 'Product is not enabled.'),
        stub: (timeMs: number) =>
            binanceStub.universalTransfers([
                buildBinance.universalTransfer({ asset: 'USDT', amount: '1', type: 'MAIN_FUNDING', tranId: 7002, timestamp: timeMs })
            ])
    },
    {
        key: 'C2C',
        endpoint: 'c2cOrders',
        respond: () => binanceErrorResponse.unauthorized(-2015, 'Invalid API-key, IP, or permissions for action.'),
        stub: (timeMs: number) =>
            binanceStub.c2cOrders(
                [buildBinance.c2cOrder({ orderNumber: 'p2p-old', tradeType: 'BUY', asset: 'USDT', amount: '1', createTime: timeMs })],
                []
            )
    }
] as const;

const CREDENTIAL_ERROR_CODES = [-2014, -2015, -1022];

const setupUsdtDepositScenario = Effect.gen(function* () {
    const fixture = yield* setupBinanceFixture({ asset: 'USDT' });
    stubEmptyBinanceBalances();
    binanceStub.deposits([buildBinance.deposit({ id: 'dep-survives', coin: 'USDT', amount: '5' })]);

    return fixture;
});

describe('binance/optional-source-unavailable', () => {
    for (const endpoint of OPTIONAL_ENDPOINTS) {
        it.effect.each(PRODUCT_ERRORS)(`skips ${endpoint} for the run on $label and syncs the rest`, ({ respond }) =>
            Effect.gen(function* () {
                const binanceSyncService = yield* BinanceSyncService;
                yield* setupUsdtDepositScenario;
                binanceStub.failEndpoint(endpoint, respond);

                yield* binanceSyncService.sync();

                expect((yield* fetchBinanceTransactions()).map(transaction => transaction.externalId)).toStrictEqual(['dep-survives']);
            }).pipe(Effect.provide(TestLayer))
        );
    }

    it.effect.each(CREDENTIAL_ERROR_CODES)('still fails the sync when locked earn answers with credential error %d', code =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const { sync } = yield* setupUsdtDepositScenario;
            binanceStub.failEndpoint('lockedEarnRewards', () => binanceErrorResponse.apiError(code, 'Credential problem.'));

            yield* binanceSyncService.sync();

            yield* expectSyncFailedAndDisabled(sync.id, 0);
        }).pipe(Effect.provide(TestLayer))
    );

    it.effect.each(BACKFILLED_SOURCES)('imports old $key history in a later run once the skipped product works', source =>
        Effect.gen(function* () {
            const binanceSyncService = yield* BinanceSyncService;
            const oldRowTimeMs = Date.now() - OLD_ROW_AGE_MS;
            const { sync, token } = yield* setupBinanceFixture({ asset: 'USDT' });
            stubEmptyBinanceBalances();
            binanceStub.failEndpoint(source.endpoint, source.respond);

            yield* binanceSyncService.sync();

            expect(yield* fetchBinanceTransactions()).toHaveLength(0);
            expect((yield* fetchHistoryProgress(token))[source.key]?.tailAt ?? Date.now()).toBeGreaterThan(oldRowTimeMs + 50 * DAY_MS);

            source.stub(oldRowTimeMs);
            yield* resyncBinance(sync.id);

            expect(yield* fetchBinanceTransactions()).toHaveLength(1);
        }).pipe(Effect.provide(TestLayer))
    );
});
