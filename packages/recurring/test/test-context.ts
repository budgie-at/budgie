import { buildTestDb, makeTestPlatformLayer, TestSeedService } from '@budgie-at/test-kit';
import * as Layer from 'effect/Layer';

import { RecurringService } from '../src/index';

export const testDbHandle = await buildTestDb();

export const testDb = testDbHandle.database;

export const testSeedService = new TestSeedService(testDb);

export const TestLayer = RecurringService.layer.pipe(Layer.provideMerge(makeTestPlatformLayer(testDb)));
