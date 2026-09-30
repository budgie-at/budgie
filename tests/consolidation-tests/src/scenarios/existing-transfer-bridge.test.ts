import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

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
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

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

layer(TestLayer)('consolidation/existing-transfer-bridge', it => {
    it.effect('nests a hand-created bridge transfer under a new source to target canonical', () =>
        Effect.gen(function* () {
            const { bridgeIncome, existingTransfer, sourceAccount, sourceExpense, targetAccount } = seedExistingTransferBridgeFixture();

            const result = yield* runConsolidation();
            const canonicalId = fetchBridgeCanonicalId();

            expect(result.consolidated).toBe(1);
            expectConsolidationParent(sourceExpense.id, canonicalId);
            expectConsolidationParent(bridgeIncome.id, canonicalId);
            expectConsolidationParent(existingTransfer.id, canonicalId);
            expect(fetchLedgerEntry(canonicalId, sourceAccount.id).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
            expect(fetchLedgerEntry(canonicalId, targetAccount.id).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
        })
    );

    it.effect('restores the hand-created transfer with its own ledger when the bridge canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeIncome, existingTransfer, sourceAccount, sourceExpense, targetAccount } =
                seedExistingTransferBridgeFixture();

            yield* expectRevertRestoresSources({
                accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
                sourceTransactionIds: [sourceExpense.id, bridgeIncome.id, existingTransfer.id]
            });

            expect(testQueryService.fetchTransactionById(existingTransfer.id).consolidationType).toBeNull();
            expect(fetchOwnLedgerEntries(existingTransfer.id)).toHaveLength(EXISTING_TRANSFER_LEDGER_ENTRY_COUNT);
        })
    );
});
