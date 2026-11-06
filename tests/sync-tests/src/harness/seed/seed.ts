import { TestSeedService } from '@budgie-at/test-kit';

import { testDb } from '../scenario/test-db';

export const seed = new TestSeedService(testDb);
