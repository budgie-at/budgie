import { resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { afterAll, beforeEach } from 'vitest';

import { testDb, testDbHandle } from './test-context';

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterAll(() => testDbHandle.dispose());
