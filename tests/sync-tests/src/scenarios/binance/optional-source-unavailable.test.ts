import { BinanceSyncService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    binanceErrorResponse,
    binanceStub,
    buildBinance,
    expectSyncFailedAndDisabled,
    fetchBinanceTransactions,
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
});
