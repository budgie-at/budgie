import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import { RecurringService } from '@budgie/recurring';
import * as Layer from 'effect/Layer';

export const testDb = buildTestDb();

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = RecurringService.layer.pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));
