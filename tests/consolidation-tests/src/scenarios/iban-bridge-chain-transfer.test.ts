import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectRevertRestoresSources,
    fetchLedgerEntry,
    fetchMovedSourceIds,
    fetchSingleCanonicalId,
    revertSingleCanonical
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
import { TestLayer } from '../harness/test-context';

const byTransactionId = (left: number, right: number): number => left - right;

const seedIbanBridgeChainFixture = () => {
    const topology = seedIbanBridgeTopology();

    return {
        ...topology,
        ...seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId),
        sourceExpense: seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId),
        targetIncome: seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId)
    };
};

const fetchChainCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

const revertChainCanonical = () => revertSingleCanonical(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

layer(TestLayer)('consolidation/iban-bridge-chain-transfer', it => {
    it.effect('builds one canonical from the four legs of a bridged chain', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, sourceAccount, sourceExpense, targetAccount, targetIncome } = seedIbanBridgeChainFixture();

            const result = yield* runConsolidation();
            const canonicalId = fetchChainCanonicalId();

            expect(result.consolidated).toBe(1);
            expect(fetchMovedSourceIds(canonicalId)).toEqual(
                [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id].sort(byTransactionId)
            );
            expect(fetchLedgerEntry(canonicalId, sourceAccount.id).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
            expect(fetchLedgerEntry(canonicalId, targetAccount.id).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
        })
    );

    it.effect('restores all four chain legs and account balances when the chain canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeExpense, bridgeIncome, sourceAccount, sourceExpense, targetAccount, targetIncome } =
                seedIbanBridgeChainFixture();

            yield* expectRevertRestoresSources({
                accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                sourceTransactionIds: [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id]
            });
        })
    );

    it.effect('rebuilds the same chain canonical shape after a revert', () =>
        Effect.gen(function* () {
            const { sourceExpense, bridgeIncome, bridgeExpense, targetIncome } = seedIbanBridgeChainFixture();

            yield* runConsolidation();
            yield* revertChainCanonical();
            const repeatedResult = yield* runConsolidation();

            expect(repeatedResult.consolidated).toBe(1);
            expect(fetchMovedSourceIds(fetchChainCanonicalId())).toEqual(
                [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id].sort(byTransactionId)
            );
        })
    );
});
