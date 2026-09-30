import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

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
import { unconsolidateById, TestLayer } from '../harness/test-context';

const DUPLICATED_LEG_COUNT = 2;

const byTransactionId = (left: number, right: number): number => left - right;

const fetchBridgeCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);

const seedIbanBridgeCanonicalDuplicateFixture = Effect.fnUntraced(function* () {
    const topology = seedIbanBridgeTopology();
    const legs = seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);

    yield* runConsolidation();

    return {
        ...topology,
        ...legs,
        canonicalId: fetchBridgeCanonicalId(),
        sourceExpense: seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId),
        targetIncome: seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId)
    };
});

layer(TestLayer)('consolidation/iban-bridge-canonical-duplicate', it => {
    it.effect('absorbs late direct legs into the existing bridge canonical instead of building a second one', () =>
        Effect.gen(function* () {
            const { canonicalId, sourceExpense, targetIncome, bridgeIncome, bridgeExpense, sourceAccount, bridgeAccount, targetAccount } =
                yield* seedIbanBridgeCanonicalDuplicateFixture();
            const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
            const balancesBeforeAbsorb = yield* fetchLedgerBalances(accountIds);

            const result = yield* runConsolidation();

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
            expect(yield* fetchLedgerBalances(accountIds)).toEqual([
                [sourceAccount.id, -IBAN_BRIDGE_EUR_AMOUNT],
                [bridgeAccount.id, 0],
                [targetAccount.id, IBAN_BRIDGE_UAH_AMOUNT]
            ]);
        })
    );

    it.effect('restores every absorbed and original leg when the shared canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeExpense, bridgeIncome, canonicalId, sourceAccount, sourceExpense, targetAccount, targetIncome } =
                yield* seedIbanBridgeCanonicalDuplicateFixture();
            const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];

            yield* runConsolidation();
            const balancesAfterAbsorb = yield* fetchLedgerBalances(accountIds);
            yield* unconsolidateById(canonicalId);

            expectRevertRemovedCanonical(canonicalId, [bridgeIncome.id, bridgeExpense.id, sourceExpense.id, targetIncome.id]);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesAfterAbsorb);
        })
    );
});
