import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import { CHAIN_RECLAIM_STALE_RATE_MULTIPLIER, seedNestedChainReclaimFixture } from '../harness/chain-reclaim-fixture';
import {
    expectCanonicalDeleted,
    expectRevertRemovedCanonical,
    expectSourcesRestored,
    fetchLedgerBalances,
    fetchMovedSourceIds,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import { IBAN_BRIDGE_SOURCE_IBAN, IBAN_BRIDGE_UAH_TO_EUR_RATE } from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, unconsolidationService } from '../harness/test-context';

const NESTED_PAIR_LEDGER_ENTRY_COUNT = 2;
const STALE_DIRECT_TRANSFER = {
    directExchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE * CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
    directToIban: IBAN_BRIDGE_SOURCE_IBAN
};

const byTransactionId = (left: number, right: number): number => left - right;

const expectRestoredNestedPair = (pairTransactionId: number, childTransactionIds: number[]): void => {
    const restoredPair = testQueryService.fetchTransactionById(pairTransactionId);

    expect(restoredPair.consolidationParentTransactionId).toBeNull();
    expect(restoredPair.deletedAt).toBeNull();
    expect(restoredPair.consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
    expect(fetchOwnLedgerEntries(pairTransactionId)).toHaveLength(NESTED_PAIR_LEDGER_ENTRY_COUNT);
    expect(testQueryService.fetchChildTransactionIds(pairTransactionId).sort(byTransactionId)).toEqual(
        [...childTransactionIds].sort(byTransactionId)
    );
    expect(fetchMovedSourceIds(pairTransactionId)).toEqual([...childTransactionIds].sort(byTransactionId));
};

describe('consolidation/unconsolidate-nested-canonical', () => {
    it('restores the nested transfer pair with its own children when the rebuilt outer canonical is reverted', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, sourceExpense, targetIncome } =
            await seedNestedChainReclaimFixture(STALE_DIRECT_TRANSFER);

        await runConsolidation();
        const outerCanonicalId = fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);
        await unconsolidationService.unconsolidateById(outerCanonicalId, testDb);

        expect(outerCanonicalId).not.toBe(directTransfer.id);
        expectCanonicalDeleted(outerCanonicalId);
        expectRestoredNestedPair(directTransfer.id, [sourceExpense.id, targetIncome.id]);
        expectSourcesRestored([bridgeIncome.id, bridgeExpense.id]);
    });

    it('restores the raw chain sources when the restored nested transfer pair is reverted in turn', async () => {
        const { bridgeAccount, directTransfer, sourceAccount, sourceExpense, targetAccount, targetIncome } =
            await seedNestedChainReclaimFixture(STALE_DIRECT_TRANSFER);
        const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
        const balancesBeforeConsolidation = await fetchLedgerBalances(accountIds);

        await runConsolidation();
        await unconsolidationService.unconsolidateById(
            fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER),
            testDb
        );
        expect(await fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);

        await unconsolidationService.unconsolidateById(directTransfer.id, testDb);

        expectRevertRemovedCanonical(directTransfer.id, [sourceExpense.id, targetIncome.id]);
        expect(await fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
    });
});
