import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import { RuleEngineService, RuleMatcherService, RuleService } from '@budgie/rules';
import * as Clock from 'effect/Clock';
import * as Layer from 'effect/Layer';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const TestLayer = Layer.mergeAll(RuleEngineService.layer, RuleMatcherService.layer, RuleService.layer).pipe(
    Layer.provideMerge(makeTestPlatformLayer(testDb)),
    Layer.provideMerge(Layer.succeed(Clock.Clock, Clock.Clock.defaultValue()))
);

export const testSeedService = new TestSeedService(testDb);
