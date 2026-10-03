import { assertStoredBalancesMatchLedger, resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { afterAll, afterEach, beforeEach } from 'vitest';

import { testDb, testDbHandle } from './test-context';

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterEach(() => Effect.runPromise(assertStoredBalancesMatchLedger(testDb)));

afterAll(() => testDbHandle.dispose());
