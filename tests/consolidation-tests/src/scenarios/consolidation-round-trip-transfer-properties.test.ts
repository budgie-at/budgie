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
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const PROPERTY_TIMEOUT = 120_000;

const transferAmount = Schema.Int.check(Schema.isBetween({ minimum: 1, maximum: 100_000 }));
const transferFee = Schema.Int.check(Schema.isBetween({ minimum: 0, maximum: 100 }));

layer(TestLayer)('consolidation/round-trip-properties transfer', it => {
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
});
