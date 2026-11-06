import * as Effect from 'effect/Effect';
import { afterAll, beforeAll } from 'vitest';

import { disposeTestDatabases, initializeTestDatabases } from '../db/build-test-db';

beforeAll(() => Effect.runPromise(initializeTestDatabases));

afterAll(() => Effect.runPromise(disposeTestDatabases));
