import { AccountBalanceRepository, TransactionEntityTable } from '@budgie/contracts';
import { TransferConsolidationService } from '@budgie/sync';
import { expect, it } from '@effect/vitest';
import { eq, inArray } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { applyMigration, testDb, TestLayer } from '../../harness';

import {
    DUPLICATE_OPERATED_AT,
    DUPLICATE_TRANSFER_REPAIR_MIGRATION,
    SOURCE_AMOUNT,
    TARGET_AMOUNT
} from './data-migration-money-impact.constant';
import {
    expectComputedBalances,
    expectStoredBalances,
    expectVisibleCanonicalTransfers,
    fetchMovedEntryCount
} from './duplicate-transfer-repair-assertion';
import { prepareDuplicateTransferRepairFixture } from './duplicate-transfer-repair-fixture';

it.effect.each([false, true])(
    'keeps distinct movements thirty seconds apart through migration with cross-account external ID collision: %s',
    crossAccountCollision =>
        Effect.gen(function* () {
            const fixture = yield* prepareDuplicateTransferRepairFixture();
            const service = yield* TransferConsolidationService;
            const balances = yield* AccountBalanceRepository;
            const originalIds = [
                fixture.duplicate.bridge.originals.income.id,
                fixture.duplicate.bridge.originals.expense.id,
                fixture.duplicate.pair.originals.expense.id,
                fixture.duplicate.pair.originals.income.id
            ];
            if (crossAccountCollision) {
                yield* testDb
                    .update(TransactionEntityTable)
                    .set({ externalId: fixture.duplicate.bridge.originals.expense.externalId })
                    .where(eq(TransactionEntityTable.id, fixture.duplicate.pair.originals.expense.id));
                yield* testDb
                    .update(TransactionEntityTable)
                    .set({ externalId: fixture.duplicate.bridge.originals.income.externalId })
                    .where(eq(TransactionEntityTable.id, fixture.duplicate.pair.originals.income.id));
            }
            yield* testDb
                .update(TransactionEntityTable)
                .set({ title: 'Own account transfer' })
                .where(inArray(TransactionEntityTable.id, originalIds));
            const originalsBefore = yield* testDb.$client.unsafe(
                'SELECT id,external_id,consolidation_parent_transaction_id FROM transactions WHERE id IN (?,?,?,?) ORDER BY id',
                originalIds
            );
            const expectedBalances = new Map([
                [fixture.sourceAccount.id, -2 * SOURCE_AMOUNT],
                [fixture.targetAccount.id, 2 * TARGET_AMOUNT]
            ]);
            yield* testDb
                .update(TransactionEntityTable)
                .set({ operatedAt: new Date(DUPLICATE_OPERATED_AT.getTime() + 30000) })
                .where(
                    inArray(TransactionEntityTable.id, [
                        fixture.duplicate.pair.canonical.id,
                        fixture.duplicate.pair.originals.expense.id,
                        fixture.duplicate.pair.originals.income.id
                    ])
                );
            expect(yield* balances.getLedgerBalances([fixture.sourceAccount.id, fixture.targetAccount.id])).toEqual(expectedBalances);
            yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
            yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
            expect(yield* service.consolidate(null)).toEqual({ found: 0, consolidated: 0 });
            expect(yield* balances.getLedgerBalances([fixture.sourceAccount.id, fixture.targetAccount.id])).toEqual(expectedBalances);
            yield* expectComputedBalances({
                sourceAccountId: fixture.sourceAccount.id,
                targetAccountId: fixture.targetAccount.id,
                sourceBalance: -2 * SOURCE_AMOUNT,
                targetBalance: 2 * TARGET_AMOUNT
            });
            yield* expectStoredBalances({
                sourceAccountId: fixture.sourceAccount.id,
                targetAccountId: fixture.targetAccount.id,
                sourceBalance: -2 * SOURCE_AMOUNT,
                targetBalance: 2 * TARGET_AMOUNT
            });
            yield* expectVisibleCanonicalTransfers({
                transactionIds: [fixture.duplicate.bridge.canonical.id, fixture.duplicate.pair.canonical.id],
                expectedCount: 2
            });
            expect(
                yield* testDb.$client.unsafe(
                    'SELECT id,external_id,consolidation_parent_transaction_id FROM transactions WHERE id IN (?,?,?,?) ORDER BY id',
                    originalIds
                )
            ).toEqual(originalsBefore);
            expect(yield* fetchMovedEntryCount(fixture.duplicate.bridge.canonical.id)).toBe(2);
            expect(yield* fetchMovedEntryCount(fixture.duplicate.pair.canonical.id)).toBe(2);
        }).pipe(Effect.provide(TestLayer))
);
