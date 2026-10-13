import { TestQueryService } from '@budgie-at/test-kit';

import { testDb } from '../scenario/setup';

export const testQueryService = new TestQueryService(testDb);
