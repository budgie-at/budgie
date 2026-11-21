import { resetTestDb } from '@budgie-at/test-kit';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import {
    expectSourcesRestored,
    expectSourceStateRestored,
    fetchLedgerBalances,
    snapshotSourceState
} from '../harness/consolidation-revert-audit';
import { seedManualExpenseDuplicateAccounts, seedManualExpenseDuplicatePairs } from '../harness/manual-expense-duplicate-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, unconsolidateById, TestLayer } from '../harness/test-context';

const PROPERTY_TIMEOUT = 120_000;

const duplicateCount = Schema.Int.check(Schema.isBetween({ minimum: 3, maximum: 5 }));

layer(TestLayer)('consolidation/round-trip-properties manual-duplicates', it => {
    it.effect.prop(
        'consolidating then unconsolidating manual duplicates restores balances and sources',
        { count: duplicateCount },
        ({ count }) =>
            Effect.gen(function* () {
                yield* resetTestDb(testDb);
                const accounts = yield* seedManualExpenseDuplicateAccounts();
                const pairs = yield* seedManualExpenseDuplicatePairs(
                    accounts,
                    Array.from({ length: count }, (_, index) => index)
                );
                const accountIds = [accounts.syncedAccount.id, accounts.manualAccount.id];
                const sourceIds = pairs.flatMap(({ manual, synced }) => [manual.id, synced.id]);
                const balancesBefore = yield* fetchLedgerBalances(accountIds);
                const stateBefore = yield* snapshotSourceState(sourceIds);

                expect((yield* runConsolidation()).consolidated).toBe(count);

                for (const { synced } of pairs) {
                    yield* unconsolidateById(synced.id);
                }

                yield* expectSourcesRestored(pairs.map(({ manual }) => manual.id));
                yield* expectSourceStateRestored(stateBefore);
                expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBefore);
            }),
        PROPERTY_TIMEOUT
    );
});
