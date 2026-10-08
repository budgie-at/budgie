import { AccountBalanceRepository } from '@budgie/contracts';
import { expect } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { applyMigration, testDb } from '../../harness';

import { DUPLICATE_TRANSFER_REPAIR_MIGRATION, SOURCE_AMOUNT, TARGET_AMOUNT } from './data-migration-money-impact.constant';

interface ExpectComputedBalancesInputInterface {
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
    readonly sourceBalance: number;
    readonly targetBalance: number;
}

interface ExpectVisibleCanonicalTransfersInputInterface {
    readonly transactionIds: readonly number[];
    readonly expectedCount: number;
}

interface ExpectDuplicatePairStillVisibleInputInterface {
    readonly bridgeCanonicalId: number;
    readonly pairCanonicalId: number;
}

interface ExpectCompetingCanonicalGroupVisibleInputInterface extends ExpectDuplicatePairStillVisibleInputInterface {
    readonly competingCanonicalId: number;
}

interface ApplyMigrationAndExpectComputedDuplicatePairInputInterface extends ExpectDuplicatePairStillVisibleInputInterface {
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
}

interface ApplyMigrationAndExpectComputedCompetingGroupInputInterface extends ApplyMigrationAndExpectComputedDuplicatePairInputInterface {
    readonly competingCanonicalId: number;
    readonly sourceBalance: number;
    readonly targetBalance: number;
}

const fetchVisibleCanonicalTransferCount = (transactionIds: readonly number[]) =>
    Effect.map(
        testDb.$client.unsafe<{ count: number }>(
            `SELECT COUNT(*) AS count FROM transactions WHERE id IN (${transactionIds.map(() => '?').join(', ')}) AND deleted_at IS NULL AND consolidation_parent_transaction_id IS NULL`,
            [...transactionIds]
        ),
        rows => rows[0]?.count ?? 0
    );

const fetchStoredBalance = (accountId: number) =>
    Effect.map(
        testDb.$client.unsafe<{ amount: number }>('SELECT amount FROM account_balances WHERE account_id = ?', [accountId]),
        rows => rows[0]?.amount ?? 0
    );

export const fetchMovedEntryCount = (transactionId: number) =>
    Effect.map(
        testDb.$client.unsafe<{ count: number }>(
            'SELECT COUNT(*) AS count FROM transaction_entries WHERE transaction_id = ? AND original_transaction_id IS NOT NULL AND deleted_at IS NULL',
            [transactionId]
        ),
        rows => rows[0]?.count ?? 0
    );

export const fetchTransactionTagCount = (transactionId: number, tagId: number) =>
    Effect.map(
        testDb.$client.unsafe<{ count: number }>('SELECT COUNT(*) AS count FROM transaction_tags WHERE transaction_id = ? AND tag_id = ?', [
            transactionId,
            tagId
        ]),
        rows => rows[0]?.count ?? 0
    );

export const expectVisibleCanonicalTransfers = Effect.fnUntraced(function* (input: ExpectVisibleCanonicalTransfersInputInterface) {
    expect(yield* fetchVisibleCanonicalTransferCount(input.transactionIds)).toBe(input.expectedCount);
});

export const expectDuplicatePairStillVisible = Effect.fnUntraced(function* (input: ExpectDuplicatePairStillVisibleInputInterface) {
    yield* expectVisibleCanonicalTransfers({ transactionIds: [input.bridgeCanonicalId, input.pairCanonicalId], expectedCount: 2 });
});

export const expectCompetingCanonicalGroupVisible = Effect.fnUntraced(function* (
    input: ExpectCompetingCanonicalGroupVisibleInputInterface
) {
    yield* expectVisibleCanonicalTransfers({
        transactionIds: [input.bridgeCanonicalId, input.pairCanonicalId, input.competingCanonicalId],
        expectedCount: 3
    });
});

export const expectComputedBalances = Effect.fnUntraced(function* (input: ExpectComputedBalancesInputInterface) {
    const accountBalanceRepository = yield* AccountBalanceRepository;

    expect((yield* accountBalanceRepository.getByAccountId(input.sourceAccountId)).at(0)?.balance).toBe(input.sourceBalance);
    expect((yield* accountBalanceRepository.getByAccountId(input.targetAccountId)).at(0)?.balance).toBe(input.targetBalance);
});

export const expectStoredBalances = Effect.fnUntraced(function* (input: ExpectComputedBalancesInputInterface) {
    expect(yield* fetchStoredBalance(input.sourceAccountId)).toBe(input.sourceBalance);
    expect(yield* fetchStoredBalance(input.targetAccountId)).toBe(input.targetBalance);
});

export const applyMigrationAndExpectComputedDuplicatePair = Effect.fnUntraced(function* (
    input: ApplyMigrationAndExpectComputedDuplicatePairInputInterface
) {
    yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
    yield* expectComputedBalances({
        sourceAccountId: input.sourceAccountId,
        targetAccountId: input.targetAccountId,
        sourceBalance: -2 * SOURCE_AMOUNT,
        targetBalance: 2 * TARGET_AMOUNT
    });
    yield* expectDuplicatePairStillVisible(input);
});

export const applyMigrationAndExpectComputedCompetingGroup = Effect.fnUntraced(function* (
    input: ApplyMigrationAndExpectComputedCompetingGroupInputInterface
) {
    yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
    yield* expectComputedBalances(input);
    yield* expectCompetingCanonicalGroupVisible(input);
});
