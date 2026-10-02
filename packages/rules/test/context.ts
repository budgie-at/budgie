import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import { RuleEngineService, RuleHost, RuleMatcherService, RuleService } from '@budgie/rules';
import * as Clock from 'effect/Clock';
import * as Effect from 'effect/Effect';
import * as Layer from 'effect/Layer';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const testSeedService = new TestSeedService(testDb);

const ruleHostLayer = Layer.succeed(
    RuleHost,
    RuleHost.of({
        convertAmount: (_fromInstrumentId, _toInstrumentId, amountInMicroUnits) =>
            Effect.succeed({ amount: amountInMicroUnits, exchangeRate: 1 }),
        valueEntry: () => Effect.succeed({ baseInstrumentId: null, baseExchangeRate: null, baseAmount: null }),
        refreshBalances: Effect.void,
        assertTransferAccountsAllowed: () => Effect.void
    })
);

export const TestLayer = Layer.mergeAll(RuleEngineService.layer, RuleMatcherService.layer, RuleService.layer).pipe(
    Layer.provide(ruleHostLayer),
    Layer.provideMerge(makeTestPlatformLayer(testDb)),
    Layer.provideMerge(Layer.succeed(Clock.Clock, Clock.Clock.defaultValue()))
);
