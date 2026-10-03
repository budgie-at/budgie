import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectConsolidationParent,
    expectRevertRestoresSources,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    seedIbanBridgeIncomeLeg,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTopology,
    expectBridgeLedgerAmounts
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const EXISTING_TRANSFER_LEDGER_ENTRY_COUNT = 2;

const seedExistingTransferBridgeFixture = () =>
    Effect.gen(function* () {
        const topology = yield* seedIbanBridgeTopology();

        return {
            ...topology,
            sourceExpense: yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId),
            bridgeIncome: yield* seedIbanBridgeIncomeLeg(topology.bridgeAccount.id, topology.transferMccId),
            existingTransfer: yield* testSeedService.directTransfer({
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
    });

const fetchBridgeCanonicalId = () =>
    Effect.gen(function* () {
        return yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
    });

layer(TestLayer)('consolidation/existing-transfer-bridge', it => {
    it.effect('nests a hand-created bridge transfer under a new source to target canonical', () =>
        Effect.gen(function* () {
            const { bridgeIncome, existingTransfer, sourceAccount, sourceExpense, targetAccount } =
                yield* seedExistingTransferBridgeFixture();

            const result = yield* runConsolidation();
            const canonicalId = yield* fetchBridgeCanonicalId();

            expect(result.consolidated).toBe(1);
            yield* expectConsolidationParent(sourceExpense.id, canonicalId);
            yield* expectConsolidationParent(bridgeIncome.id, canonicalId);
            yield* expectConsolidationParent(existingTransfer.id, canonicalId);
            yield* expectBridgeLedgerAmounts(canonicalId, sourceAccount.id, targetAccount.id);
        })
    );

    it.effect('restores the hand-created transfer with its own ledger when the bridge canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeIncome, existingTransfer, sourceAccount, sourceExpense, targetAccount } =
                yield* seedExistingTransferBridgeFixture();

            yield* expectRevertRestoresSources({
                accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
                sourceTransactionIds: [sourceExpense.id, bridgeIncome.id, existingTransfer.id]
            });

            expect((yield* testQueryService.fetchTransactionById(existingTransfer.id)).consolidationType).toBeNull();
            expect(yield* fetchOwnLedgerEntries(existingTransfer.id)).toHaveLength(EXISTING_TRANSFER_LEDGER_ENTRY_COUNT);
        })
    );
});
