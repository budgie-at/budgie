import { expect } from 'vitest';

import { isDefined } from '@rnw-community/shared';

import { runConsolidation } from './run-consolidation';
import { accountBalanceRepository, testDb, testQueryService, unconsolidationService } from './test-context';

import type { TransactionConsolidationTypeEnum, TransactionEntryEntityInterface } from '@budgie/contracts';

export const expectConsolidationParent = (sourceTransactionId: number, canonicalTransactionId: number): void => {
    expect(testQueryService.fetchTransactionById(sourceTransactionId).consolidationParentTransactionId).toBe(canonicalTransactionId);
};

export const fetchOwnLedgerEntries = (transactionId: number): TransactionEntryEntityInterface[] =>
    testQueryService.fetchEntriesByTransactionId(transactionId).filter(entry => !isDefined(entry.originalTransactionId));

export const fetchMovedSourceIds = (canonicalTransactionId: number): number[] =>
    testQueryService
        .fetchEntriesByTransactionId(canonicalTransactionId)
        .flatMap(entry => (isDefined(entry.originalTransactionId) ? [entry.originalTransactionId] : []))
        .sort((left, right) => left - right);

export const fetchLedgerEntry = (transactionId: number, accountId: number): TransactionEntryEntityInterface => {
    const entry = fetchOwnLedgerEntries(transactionId).find(candidate => candidate.accountId === accountId);

    if (!isDefined(entry)) {
        throw new Error(`Ledger entry for account ${accountId} on transaction ${transactionId} not found`);
    }

    return entry;
};

export const expectSourcesRestored = (sourceTransactionIds: number[]): void => {
    for (const sourceTransactionId of sourceTransactionIds) {
        const source = testQueryService.fetchTransactionById(sourceTransactionId);

        expect(source.consolidationParentTransactionId).toBeNull();
        expect(source.deletedAt).toBeNull();
        expect(fetchMovedSourceIds(sourceTransactionId)).toEqual([]);
        expect(fetchOwnLedgerEntries(sourceTransactionId).length).toBeGreaterThan(0);
    }
};

export const expectCanonicalDeleted = (canonicalTransactionId: number): void => {
    expect(testQueryService.findTransactionById(canonicalTransactionId)).toBeUndefined();
    expect(testQueryService.fetchEntriesByTransactionId(canonicalTransactionId)).toEqual([]);
    expect(testQueryService.fetchChildTransactionIds(canonicalTransactionId)).toEqual([]);
};

export const expectRevertRemovedCanonical = (canonicalTransactionId: number, sourceTransactionIds: number[]): void => {
    expectCanonicalDeleted(canonicalTransactionId);
    expectSourcesRestored(sourceTransactionIds);
};

export const fetchSingleCanonicalId = (consolidationType: TransactionConsolidationTypeEnum): number => {
    const canonicals = testQueryService.fetchCanonicalsOfType(consolidationType);

    expect(canonicals).toHaveLength(1);

    return canonicals[0].id;
};

export const revertSingleCanonical = async (consolidationType: TransactionConsolidationTypeEnum): Promise<number> => {
    const canonicalId = fetchSingleCanonicalId(consolidationType);

    await unconsolidationService.unconsolidateById(canonicalId, testDb);

    return canonicalId;
};

export const fetchLedgerBalances = async (accountIds: number[]): Promise<number[][]> => {
    const balances = await accountBalanceRepository.getNewTransactionEntriesDeltas(accountIds);

    return accountIds.map(accountId => [accountId, balances.get(accountId) ?? 0]);
};

export const expectRevertRestoresSources = async (input: {
    readonly accountIds: number[];
    readonly consolidationType: TransactionConsolidationTypeEnum;
    readonly sourceTransactionIds: number[];
}): Promise<void> => {
    const balancesBeforeConsolidation = await fetchLedgerBalances(input.accountIds);
    const consolidationResult = await runConsolidation();

    expect(consolidationResult.consolidated).toBe(1);

    expectRevertRemovedCanonical(await revertSingleCanonical(input.consolidationType), input.sourceTransactionIds);
    expect(await fetchLedgerBalances(input.accountIds)).toEqual(balancesBeforeConsolidation);
};
