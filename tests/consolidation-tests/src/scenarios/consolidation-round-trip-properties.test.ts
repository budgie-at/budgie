import { resetTestDb } from '@budgie-at/test-kit';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';
import * as Schema from 'effect/Schema';

import {
    expectSourcesRestored,
    expectSourceStateRestored,
    fetchLedgerBalances,
    revertSingleCanonical,
    snapshotSourceState
} from '../harness/consolidation-revert-audit';
import { seedManualExpenseDuplicateAccounts, seedManualExpenseDuplicatePairs } from '../harness/manual-expense-duplicate-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

const PROPERTY_TIMEOUT = 120_000;

const transferAmount = Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100_000 }));
const transferFee = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100 }));
const duplicateCount = Schema.Int.check(Schema.isBetween({ minimum: 3, maximum: 5 }));

layer(TestLayer)('consolidation/round-trip-properties', it => {
    it.effect.prop(
        'consolidating then unconsolidating a transfer pair restores balances and sources',
        { amount: transferAmount, fee: transferFee },
        ({ amount, fee }) =>
            Effect.gen(function* () {
                yield* resetTestDb(testDb);
                const transferMcc = yield* testQueryService.findMccByCode('4829');
                const { expense, fromAccount, income, toAccount } = yield* testSeedService.amountTransferPair(
                    (amount + fee) * PRECISION,
                    transferMcc.id
                );

                if (fee > 0) {
                    yield* testSeedService.feeEntry(expense.id, 'transfer-fee', { accountId: fromAccount.id, amount: fee * PRECISION });
                }

                const accountIds = [fromAccount.id, toAccount.id];
                const sourceIds = [expense.id, income.id];
                const balancesBefore = yield* fetchLedgerBalances(accountIds);
                const stateBefore = yield* snapshotSourceState(sourceIds);

                expect((yield* runConsolidation()).consolidated).toBe(1);
                expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBefore);

                yield* revertSingleCanonical(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

                yield* expectSourcesRestored(sourceIds);
                yield* expectSourceStateRestored(stateBefore);
                expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBefore);
            }),
        PROPERTY_TIMEOUT
    );

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
