import { assertStoredBalancesMatchLedger, resetTestDb } from '@budgie-at/test-kit';
import * as Effect from 'effect/Effect';
import { afterAll, afterEach, beforeEach } from 'vitest';

import { rebuildStoredBalances, testDb, testDbHandle, TestLayer } from './test-context';

beforeEach(() => Effect.runPromise(resetTestDb(testDb)));

afterEach(() =>
    Effect.runPromise(
        assertStoredBalancesMatchLedger(testDb).pipe(
            Effect.andThen(rebuildStoredBalances),
            Effect.andThen(assertStoredBalancesMatchLedger(testDb)),
            Effect.provide(TestLayer)
        )
    )
);

afterAll(() => testDbHandle.dispose());
