import { resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { beforeEach } from 'vitest';

import { testDb } from './test-context';

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));
