import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import * as Layer from 'effect/Layer';

import { RecurringService } from '../src/index';
import { RecurringRepository } from '../src/repository/recurring.repository';

export const testDb = await buildTestDb();

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = Layer.merge(RecurringService.layer, RecurringRepository.layer).pipe(
    Layer.provideMerge(makeTestPlatformLayer(testDb))
);
