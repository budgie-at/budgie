import { AccountBalanceRepository } from '@budgie/contracts';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from './run-consolidation';
import { testQueryService, unconsolidateById } from './test-context';

import type { SourceStateSnapshotInterface } from './interface/source-state-snapshot.interface';
import type { TransactionConsolidationTypeEnum } from '@budgie/contracts';

export const expectConsolidationParent = (sourceTransactionId: number, canonicalTransactionId: number) =>
    Effect.gen(function* () {
        expect((yield* testQueryService.fetchTransactionById(sourceTransactionId)).consolidationParentTransactionId).toBe(
            canonicalTransactionId
        );
    });

export const fetchOwnLedgerEntries = (transactionId: number) =>
    Effect.gen(function* () {
        return (yield* testQueryService.fetchEntriesByTransactionId(transactionId)).filter(
            entry => !isDefined(entry.originalTransactionId)
        );
    });

export const fetchMovedSourceIds = (canonicalTransactionId: number) =>
    Effect.gen(function* () {
        return (yield* testQueryService.fetchEntriesByTransactionId(canonicalTransactionId))
            .flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []))
            .sort((left, right) => left - right);
    });

export const fetchLedgerEntry = (transactionId: number, accountId: number) =>
    Effect.gen(function* () {
        const entry = (yield* fetchOwnLedgerEntries(transactionId)).find(candidate => candidate.accountId === accountId);

        if (!isDefined(entry)) {
            throw new Error(`Ledger entry for account ${accountId} on transaction ${transactionId} not found`);
        }

        return entry;
    });

export const expectSourcesRestored = (sourceTransactionIds: number[]) =>
    Effect.gen(function* () {
        for (const sourceTransactionId of sourceTransactionIds) {
            const source = yield* testQueryService.fetchTransactionById(sourceTransactionId);

            expect(source.consolidationParentTransactionId).toBeNull();
            expect(source.deletedAt).toBeNull();
            expect(yield* fetchMovedSourceIds(sourceTransactionId)).toEqual([]);
            expect((yield* fetchOwnLedgerEntries(sourceTransactionId)).length).toBeGreaterThan(0);
        }
    });

const compareSnapshotEntries = (
    left: SourceStateSnapshotInterface['entries'][number],
    right: SourceStateSnapshotInterface['entries'][number]
): number => left.accountId - right.accountId || left.type.localeCompare(right.type) || left.amount - right.amount;

const buildSourceStateSnapshot = (transactionId: number) =>
    Effect.gen(function* () {
        const transaction = yield* testQueryService.fetchTransactionById(transactionId);

        return {
            comment: transaction.comment,
            consolidationType: transaction.consolidationType,
            entries: (yield* fetchOwnLedgerEntries(transactionId))
                .map(entry => ({
                    accountId: entry.accountId,
                    amount: entry.amount,
                    categoryId: entry.categoryId,
                    categorySource: entry.categorySource,
                    exchangeRate: entry.exchangeRate,
                    mccCategoryId: entry.mccCategoryId,
                    toIban: entry.toIban,
                    type: entry.type
                }))
                .sort(compareSnapshotEntries),
            exchangeRate: transaction.exchangeRate,
            fromAccountId: transaction.fromAccountId,
            tagIds: (yield* testQueryService.fetchTransactionTagIds(transactionId)).sort((left, right) => left - right),
            toAccountId: transaction.toAccountId,
            transactionId,
            type: transaction.type
        };
    });

export const snapshotSourceState = (transactionIds: number[]) =>
    Effect.forEach(transactionIds, transactionId => buildSourceStateSnapshot(transactionId));

export const expectSourceStateRestored = (snapshots: SourceStateSnapshotInterface[]) =>
    Effect.gen(function* () {
        for (const snapshot of snapshots) {
            expect(yield* buildSourceStateSnapshot(snapshot.transactionId)).toEqual(snapshot);
        }
    });

export const expectCanonicalDeleted = (canonicalTransactionId: number) =>
    Effect.gen(function* () {
        expect(yield* testQueryService.findTransactionById(canonicalTransactionId)).toBeUndefined();
        expect(yield* testQueryService.fetchEntriesByTransactionId(canonicalTransactionId)).toEqual([]);
        expect(yield* testQueryService.fetchChildTransactionIds(canonicalTransactionId)).toEqual([]);
    });

export const expectRevertRemovedCanonical = (canonicalTransactionId: number, sourceTransactionIds: number[]) =>
    Effect.gen(function* () {
        yield* expectCanonicalDeleted(canonicalTransactionId);
        yield* expectSourcesRestored(sourceTransactionIds);
    });

export const fetchSingleCanonicalId = (consolidationType: TransactionConsolidationTypeEnum) =>
    Effect.gen(function* () {
        const canonicals = yield* testQueryService.fetchCanonicalsOfType(consolidationType);

        expect(canonicals).toHaveLength(1);

        return canonicals[0].id;
    });

export const revertSingleCanonical = Effect.fnUntraced(function* (consolidationType: TransactionConsolidationTypeEnum) {
    const canonicalId = yield* fetchSingleCanonicalId(consolidationType);

    yield* unconsolidateById(canonicalId);

    return canonicalId;
});

export const fetchLedgerBalances = Effect.fnUntraced(function* (accountIds: number[]) {
    const accountBalanceRepository = yield* AccountBalanceRepository;
    const balances = yield* accountBalanceRepository.getLedgerBalances(accountIds);

    return accountIds.map(accountId => [accountId, balances.get(accountId) ?? 0]);
});

export const expectRevertRestoresSources = Effect.fnUntraced(function* (input: {
    readonly accountIds: number[];
    readonly consolidationType: TransactionConsolidationTypeEnum;
    readonly sourceTransactionIds: number[];
}) {
    const stateBeforeConsolidation = yield* snapshotSourceState(input.sourceTransactionIds);
    const balancesBeforeConsolidation = yield* fetchLedgerBalances(input.accountIds);
    const consolidationResult = yield* runConsolidation();

    expect(consolidationResult.consolidated).toBe(1);

    yield* expectRevertRemovedCanonical(yield* revertSingleCanonical(input.consolidationType), input.sourceTransactionIds);
    yield* expectSourceStateRestored(stateBeforeConsolidation);
    expect(yield* fetchLedgerBalances(input.accountIds)).toEqual(balancesBeforeConsolidation);
});
