import { TestQueryService } from '@budgie-at/test-kit';

import { testDb } from '../scenario/test-db';

export const testQueryService = new TestQueryService(testDb);
