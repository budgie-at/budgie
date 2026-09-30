import { assertStoredBalancesMatchLedger, resetTestDb } from '@budgie-at/test-kit';
import { afterEach, beforeEach } from 'vitest';

import { testDb } from './test-context';

beforeEach(() => {
    resetTestDb(testDb);
});

afterEach(async () => {
    await assertStoredBalancesMatchLedger(testDb);
});
