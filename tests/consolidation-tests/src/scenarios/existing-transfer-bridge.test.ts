import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    expectConsolidationParent,
    expectRevertRestoresSources,
    fetchLedgerEntry,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    seedIbanBridgeIncomeLeg,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const EXISTING_TRANSFER_LEDGER_ENTRY_COUNT = 2;

const seedExistingTransferBridgeFixture = () => {
    const topology = seedIbanBridgeTopology();

    return {
        ...topology,
        sourceExpense: seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId),
        bridgeIncome: seedIbanBridgeIncomeLeg(topology.bridgeAccount.id, topology.transferMccId),
        existingTransfer: testSeedService.directTransfer({
            consolidationType: null,
            exchangeRate: 1,
            operatedAt: IBAN_BRIDGE_OPERATED_AT,
            sourceAccountId: topology.bridgeAccount.id,
            sourceAmount: IBAN_BRIDGE_UAH_AMOUNT,
            sourceEntryExchangeRate: 1,
            targetAccountId: topology.targetAccount.id,
            targetAmount: IBAN_BRIDGE_UAH_AMOUNT,
            toIban: IBAN_BRIDGE_TARGET_IBAN
        })
    };
};

const fetchBridgeCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);

describe('consolidation/existing-transfer-bridge', () => {
    it('nests a hand-created bridge transfer under a new source to target canonical', async () => {
        const { bridgeIncome, existingTransfer, sourceAccount, sourceExpense, targetAccount } = seedExistingTransferBridgeFixture();

        const result = await runConsolidation();
        const canonicalId = fetchBridgeCanonicalId();

        expect(result.consolidated).toBe(1);
        expectConsolidationParent(sourceExpense.id, canonicalId);
        expectConsolidationParent(bridgeIncome.id, canonicalId);
        expectConsolidationParent(existingTransfer.id, canonicalId);
        expect(fetchLedgerEntry(canonicalId, sourceAccount.id).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
        expect(fetchLedgerEntry(canonicalId, targetAccount.id).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
    });

    it('restores the hand-created transfer with its own ledger when the bridge canonical is reverted', async () => {
        const { bridgeAccount, bridgeIncome, existingTransfer, sourceAccount, sourceExpense, targetAccount } =
            seedExistingTransferBridgeFixture();

        await expectRevertRestoresSources({
            accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
            consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            sourceTransactionIds: [sourceExpense.id, bridgeIncome.id, existingTransfer.id]
        });

        expect(testQueryService.fetchTransactionById(existingTransfer.id).consolidationType).toBeNull();
        expect(fetchOwnLedgerEntries(existingTransfer.id)).toHaveLength(EXISTING_TRANSFER_LEDGER_ENTRY_COUNT);
    });
});
