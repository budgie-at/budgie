import { buildTestDb, TestSeedService } from '@budgie-at/test-kit';
import { Db } from '@budgie/contracts';
import * as Clock from 'effect/Clock';
import * as Layer from 'effect/Layer';

export const testDb = buildTestDb();

export const TestLayer = Layer.mergeAll(Layer.succeed(Db, testDb), Layer.succeed(Clock.Clock, Clock.Clock.defaultValue()));

export const testSeedService = new TestSeedService(testDb);
