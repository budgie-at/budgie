import { AccountBalanceRepository, PRECISION, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { describe, expect, it } from '@effect/vitest';
import { and, eq, isNull } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { seed, testDb, testQueryService, TestLayer } from '../../harness';
import { snapshotMissingTransferFeeDeltas } from '../../harness/backup-replay/snapshot-missing-transfer-fee-deltas';

const FEE_AMOUNT = 2 * PRECISION;

describe('database/backup-replay-fee-repair', () => {
    it.effect('predicts only the missing legacy fee delta before replay and no delta on a second replay', () =>
        Effect.gen(function* () {
            const consolidation = yield* TransferConsolidationService;
            const balances = yield* AccountBalanceRepository;
            const transferMcc = yield* testQueryService.findMccByCode('4829');
            const { expense, fromAccount, toAccount } = yield* seed.amountTransferPair(100 * PRECISION, transferMcc.id);

            yield* seed.feeEntry(expense.id, 'legacy-fee', { accountId: fromAccount.id, amount: FEE_AMOUNT });
            yield* consolidation.consolidate(null);
            expect(yield* snapshotMissingTransferFeeDeltas()).toEqual(new Map());

            yield* testDb
                .delete(TransactionEntryEntityTable)
                .where(
                    and(
                        eq(TransactionEntryEntityTable.accountId, fromAccount.id),
                        eq(TransactionEntryEntityTable.type, TransactionEntryTypeEnum.FEE),
                        isNull(TransactionEntryEntityTable.originalTransactionId)
                    )
                );

            const before = yield* balances.getLedgerBalances([fromAccount.id, toAccount.id]);
            const expected = yield* snapshotMissingTransferFeeDeltas();

            expect(expected).toEqual(new Map([[fromAccount.id, -FEE_AMOUNT]]));
            yield* consolidation.consolidate(null);

            const after = yield* balances.getLedgerBalances([fromAccount.id, toAccount.id]);

            for (const accountId of [fromAccount.id, toAccount.id]) {
                expect((after.get(accountId) ?? 0) - (before.get(accountId) ?? 0)).toBe(expected.get(accountId) ?? 0);
            }

            expect(yield* snapshotMissingTransferFeeDeltas()).toEqual(new Map());
            yield* consolidation.consolidate(null);
            expect(yield* balances.getLedgerBalances([fromAccount.id, toAccount.id])).toEqual(after);
        }).pipe(Effect.provide(TestLayer))
    );
});
