import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectRevertRestoresSources,
    fetchMovedSourceIds,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import {
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTargetIncome,
    seedIbanBridgeTopology,
    expectBridgeLedgerAmounts
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { TestLayer } from '../harness/test-context';

const byTransactionId = (left: number, right: number): number => left - right;

const seedIbanBridgeChainFixture = () =>
    Effect.gen(function* () {
        const topology = yield* seedIbanBridgeTopology();

        return {
            ...topology,
            ...(yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId)),
            sourceExpense: yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId),
            targetIncome: yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId)
        };
    });

const fetchChainCanonicalId = () =>
    Effect.gen(function* () {
        return yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);
    });

const revertChainCanonical = () => revertSingleCanonical(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

layer(TestLayer)('consolidation/iban-bridge-chain-transfer', it => {
    it.effect('builds one canonical from the four legs of a bridged chain', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, sourceAccount, sourceExpense, targetAccount, targetIncome } =
                yield* seedIbanBridgeChainFixture();

            const result = yield* runConsolidation();
            const canonicalId = yield* fetchChainCanonicalId();

            expect(result.consolidated).toBe(1);
            expect(yield* fetchMovedSourceIds(canonicalId)).toEqual(
                [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id].sort(byTransactionId)
            );
            yield* expectBridgeLedgerAmounts(canonicalId, sourceAccount.id, targetAccount.id);
        })
    );

    it.effect('restores all four chain legs and account balances when the chain canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeExpense, bridgeIncome, sourceAccount, sourceExpense, targetAccount, targetIncome } =
                yield* seedIbanBridgeChainFixture();

            yield* expectRevertRestoresSources({
                accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER,
                sourceTransactionIds: [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id]
            });
        })
    );

    it.effect('rebuilds the same chain canonical shape after a revert', () =>
        Effect.gen(function* () {
            const { sourceExpense, bridgeIncome, bridgeExpense, targetIncome } = yield* seedIbanBridgeChainFixture();

            yield* runConsolidation();
            yield* revertChainCanonical();
            const repeatedResult = yield* runConsolidation();

            expect(repeatedResult.consolidated).toBe(1);
            expect(yield* fetchMovedSourceIds(yield* fetchChainCanonicalId())).toEqual(
                [sourceExpense.id, bridgeIncome.id, bridgeExpense.id, targetIncome.id].sort(byTransactionId)
            );
        })
    );
});
