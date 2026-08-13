import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectConsolidationParent,
    expectRevertRemovedCanonical,
    fetchLedgerBalances,
    fetchMovedSourceIds,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_UAH_AMOUNT,
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTargetIncome,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, unconsolidationService } from '../harness/test-context';

const DUPLICATED_LEG_COUNT = 2;

const byTransactionId = (left: number, right: number): number => left - right;

const fetchBridgeCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);

const seedIbanBridgeCanonicalDuplicateFixture = async () => {
    const topology = seedIbanBridgeTopology();
    const legs = seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);

    await runConsolidation();

    return {
        ...topology,
        ...legs,
        canonicalId: fetchBridgeCanonicalId(),
        sourceExpense: seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId),
        targetIncome: seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId)
    };
};

describe('consolidation/iban-bridge-canonical-duplicate', () => {
    it('absorbs late direct legs into the existing bridge canonical instead of building a second one', async () => {
        const { canonicalId, sourceExpense, targetIncome, bridgeIncome, bridgeExpense, sourceAccount, bridgeAccount, targetAccount } =
            await seedIbanBridgeCanonicalDuplicateFixture();
        const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
        const balancesBeforeAbsorb = await fetchLedgerBalances(accountIds);

        const result = await runConsolidation();

        expect(result.consolidated).toBe(1);
        expect(fetchBridgeCanonicalId()).toBe(canonicalId);
        expectConsolidationParent(sourceExpense.id, canonicalId);
        expectConsolidationParent(targetIncome.id, canonicalId);
        expect(fetchMovedSourceIds(canonicalId)).toEqual(
            [bridgeIncome.id, bridgeExpense.id, sourceExpense.id, targetIncome.id].sort(byTransactionId)
        );
        expect(balancesBeforeAbsorb).toEqual([
            [sourceAccount.id, -DUPLICATED_LEG_COUNT * IBAN_BRIDGE_EUR_AMOUNT],
            [bridgeAccount.id, 0],
            [targetAccount.id, DUPLICATED_LEG_COUNT * IBAN_BRIDGE_UAH_AMOUNT]
        ]);
        expect(await fetchLedgerBalances(accountIds)).toEqual([
            [sourceAccount.id, -IBAN_BRIDGE_EUR_AMOUNT],
            [bridgeAccount.id, 0],
            [targetAccount.id, IBAN_BRIDGE_UAH_AMOUNT]
        ]);
    });

    it('restores every absorbed and original leg when the shared canonical is reverted', async () => {
        const { bridgeAccount, bridgeExpense, bridgeIncome, canonicalId, sourceAccount, sourceExpense, targetAccount, targetIncome } =
            await seedIbanBridgeCanonicalDuplicateFixture();
        const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];

        await runConsolidation();
        const balancesAfterAbsorb = await fetchLedgerBalances(accountIds);
        await unconsolidationService.unconsolidateById(canonicalId, testDb);

        expectRevertRemovedCanonical(canonicalId, [bridgeIncome.id, bridgeExpense.id, sourceExpense.id, targetIncome.id]);
        expect(await fetchLedgerBalances(accountIds)).toEqual(balancesAfterAbsorb);
    });
});
