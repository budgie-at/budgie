import { beforeEach } from 'vitest';

import { resetTestDb } from '@budgie-at/test-kit';

import { testDb } from './test-context';

beforeEach(() => {
    resetTestDb(testDb);
});
