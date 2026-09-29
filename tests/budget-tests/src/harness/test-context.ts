import { buildTestDb, TestSeedService } from '@budgie-at/test-kit';

export const testDb = buildTestDb();

export const testSeedService = new TestSeedService(testDb);
