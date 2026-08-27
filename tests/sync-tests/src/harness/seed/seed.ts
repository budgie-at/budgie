import { TestSeedService } from '@budgie-at/test-kit';

import { testDb } from '../scenario/setup';

export const seed = new TestSeedService(testDb);
