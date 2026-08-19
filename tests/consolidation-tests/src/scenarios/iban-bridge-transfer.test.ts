import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectConsolidationParent,
    expectRevertRestoresSources,
    fetchLedgerEntry,
    fetchMovedSourceIds,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    seedIbanBridgeLegs,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';

const byTransactionId = (left: number, right: number): number => left - right;

const seedIbanBridgeTransferFixture = () => {
    const topology = seedIbanBridgeTopology();

    return { ...topology, ...seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId) };
};

describe('consolidation/iban-bridge-transfer', () => {
    it('builds a source to target canonical from two bridge legs', async () => {
        const { bridgeExpense, bridgeIncome, sourceAccount, targetAccount } = seedIbanBridgeTransferFixture();

        const result = await runConsolidation();
        const canonicalId = fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);

        expect(result.consolidated).toBe(1);
        expectConsolidationParent(bridgeIncome.id, canonicalId);
        expectConsolidationParent(bridgeExpense.id, canonicalId);
        expect(fetchMovedSourceIds(canonicalId)).toEqual([bridgeIncome.id, bridgeExpense.id].sort(byTransactionId));
        expect(fetchLedgerEntry(canonicalId, sourceAccount.id).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
        expect(fetchLedgerEntry(canonicalId, sourceAccount.id).toIban).toBe(IBAN_BRIDGE_TARGET_IBAN);
        expect(fetchLedgerEntry(canonicalId, targetAccount.id).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
    });

    it('restores both bridge legs and account balances when the bridge canonical is reverted', async () => {
        const { bridgeAccount, bridgeExpense, bridgeIncome, sourceAccount, targetAccount } = seedIbanBridgeTransferFixture();

        await expectRevertRestoresSources({
            accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
            consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            sourceTransactionIds: [bridgeIncome.id, bridgeExpense.id]
        });
    });

    it('rebuilds the same bridge canonical shape after a revert', async () => {
        const { bridgeExpense, bridgeIncome } = seedIbanBridgeTransferFixture();

        await runConsolidation();
        await revertSingleCanonical(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
        const repeatedResult = await runConsolidation();

        expect(repeatedResult.consolidated).toBe(1);
        expect(fetchMovedSourceIds(fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER))).toEqual(
            [bridgeIncome.id, bridgeExpense.id].sort(byTransactionId)
        );
    });
});
