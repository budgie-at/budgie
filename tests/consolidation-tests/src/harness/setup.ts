import { resetTestDb } from '@budgie-at/test-kit';
import { beforeEach } from 'vitest';

import { testDb } from './test-context';

beforeEach(() => {
    resetTestDb(testDb);
});
