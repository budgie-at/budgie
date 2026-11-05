import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import * as Layer from 'effect/Layer';

import { RecurringRefreshService, RecurringService } from '../src/index';
import { RecurringRepository } from '../src/repository/recurring.repository';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.mergeAll(RecurringService.layer, RecurringRefreshService.layer, RecurringRepository.layer).pipe(
    Layer.provideMerge(makeTestPlatformLayer(testDb))
);
