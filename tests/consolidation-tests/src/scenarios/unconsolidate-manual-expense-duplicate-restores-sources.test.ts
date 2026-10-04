import { CategorySourceEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectSourcesRestored,
    expectSourceStateRestored,
    fetchLedgerBalances,
    fetchOwnLedgerEntries,
    snapshotSourceState
} from '../harness/consolidation-revert-audit';
import { seedManualExpenseDuplicateAccounts, seedManualExpenseDuplicatePair } from '../harness/manual-expense-duplicate-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

layer(TestLayer)('consolidation/unconsolidate-manual-expense-duplicate-restores-sources', it => {
    it.effect('restores the exact prior state of both the synced and the manual expense', () =>
        Effect.gen(function* () {
            const accounts = yield* seedManualExpenseDuplicateAccounts();
            const manualCategory = yield* testSeedService.category('Groceries');
            const syncedCategory = yield* testSeedService.category('Restaurants');
            const manualTag = yield* testSeedService.tag('Family');
            const syncedTag = yield* testSeedService.tag('Card');
            const copiedPair = yield* seedManualExpenseDuplicatePair({
                accounts,
                index: 0,
                manualCategoryId: manualCategory.id,
                manualComment: 'Manual note'
            });
            const categorizedPair = yield* seedManualExpenseDuplicatePair({
                accounts,
                index: 1,
                manualCategoryId: manualCategory.id,
                manualComment: 'Manual note'
            });
            const taggedPair = yield* seedManualExpenseDuplicatePair({ accounts, index: 2, manualCategoryId: manualCategory.id });
            const pairs = [copiedPair, categorizedPair, taggedPair];
            const [categorizedSyncedEntry] = yield* fetchOwnLedgerEntries(categorizedPair.synced.id);

            yield* Effect.forEach(pairs, ({ manual }) => testSeedService.transactionTag(manual.id, manualTag.id));
            yield* testSeedService.transactionTag(taggedPair.synced.id, syncedTag.id);
            yield* testSeedService.transactionTag(taggedPair.synced.id, manualTag.id);
            yield* testSeedService.entryCategory(categorizedSyncedEntry.id, syncedCategory.id, CategorySourceEnum.AI);

            const sourceTransactionIds = pairs.flatMap(({ synced, manual }) => [synced.id, manual.id]);
            const accountIds = [accounts.syncedAccount.id, accounts.manualAccount.id];
            const stateBeforeConsolidation = yield* snapshotSourceState(sourceTransactionIds);
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

            expect((yield* runConsolidation()).consolidated).toBe(3);

            yield* Effect.forEach(pairs, ({ synced }) => unconsolidateById(synced.id));

            yield* expectSourcesRestored(pairs.map(({ manual }) => manual.id));
            yield* expectSourceStateRestored(stateBeforeConsolidation);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
        })
    );
});
