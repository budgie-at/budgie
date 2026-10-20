import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectConsolidationParent,
    expectRevertRemovedCanonical,
    fetchLedgerBalances,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_UAH_TO_EUR_RATE,
    expectIbanBridgeBalances,
    fetchBridgeCanonicalId,
    parentConsolidationSource,
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTargetIncome,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { rebuildStoredBalances, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const SOURCE_FEE_AMOUNT = 5 * PRECISION;

const seedBridgeWithSourceExpense = Effect.fnUntraced(function* () {
    const topology = yield* seedIbanBridgeTopology();
    const legs = yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);
    const sourceExpense = yield* seedIbanBridgeSourceExpense(
        topology.sourceAccount.id,
        topology.transferMccId,
        topology.bridgeAccount.iban
    );
    const accountIds: [number, number, number] = [topology.sourceAccount.id, topology.bridgeAccount.id, topology.targetAccount.id];

    return { ...topology, ...legs, accountIds, sourceExpense };
});

const expectNoTransferPair = Effect.fnUntraced(function* () {
    expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
});

layer(TestLayer)('consolidation/iban-bridge-end-leg-absorption', it => {
    it.effect('claims the synced source expense and the target income that arrives after the bridge', () =>
        Effect.gen(function* () {
            const fixture = yield* seedBridgeWithSourceExpense();

            yield* runConsolidation();
            const canonicalId = yield* fetchBridgeCanonicalId();

            yield* expectConsolidationParent(fixture.sourceExpense.id, canonicalId);
            yield* expectIbanBridgeBalances(fixture.accountIds, -IBAN_BRIDGE_EUR_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT);

            const targetIncome = yield* seedIbanBridgeTargetIncome(fixture.targetAccount.id, fixture.transferMccId);
            yield* rebuildStoredBalances;

            expect((yield* runConsolidation()).consolidated).toBe(1);
            yield* expectConsolidationParent(targetIncome.id, canonicalId);
            yield* expectNoTransferPair();
            yield* expectIbanBridgeBalances(fixture.accountIds, -IBAN_BRIDGE_EUR_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('merges a transfer pair that already re-counted the bridge end legs', () =>
        Effect.gen(function* () {
            const topology = yield* seedIbanBridgeTopology();
            const accountIds: [number, number, number] = [topology.sourceAccount.id, topology.bridgeAccount.id, topology.targetAccount.id];
            yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);
            yield* runConsolidation();
            const canonicalId = yield* fetchBridgeCanonicalId();
            const sourceExpense = yield* seedIbanBridgeSourceExpense(
                topology.sourceAccount.id,
                topology.transferMccId,
                topology.bridgeAccount.iban
            );
            const targetIncome = yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId);
            const duplicatePair = yield* testSeedService.directTransfer({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
                operatedAt: new Date(IBAN_BRIDGE_OPERATED_AT.getTime() + 1000),
                sourceAccountId: topology.sourceAccount.id,
                sourceAmount: IBAN_BRIDGE_EUR_AMOUNT,
                sourceEntryExchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
                targetAccountId: topology.targetAccount.id,
                targetAmount: IBAN_BRIDGE_UAH_AMOUNT,
                toIban: topology.bridgeAccount.iban
            });
            yield* parentConsolidationSource(sourceExpense.id, duplicatePair.id);
            yield* parentConsolidationSource(targetIncome.id, duplicatePair.id);
            yield* rebuildStoredBalances;
            yield* expectIbanBridgeBalances(accountIds, -2 * IBAN_BRIDGE_EUR_AMOUNT, 2 * IBAN_BRIDGE_UAH_AMOUNT);

            expect((yield* runConsolidation()).consolidated).toBe(1);

            yield* expectNoTransferPair();
            expect(yield* testQueryService.findTransactionById(duplicatePair.id)).toBeUndefined();
            yield* expectConsolidationParent(sourceExpense.id, canonicalId);
            yield* expectConsolidationParent(targetIncome.id, canonicalId);
            yield* expectIbanBridgeBalances(accountIds, -IBAN_BRIDGE_EUR_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('keeps the source fee on the ledger when the source expense is claimed', () =>
        Effect.gen(function* () {
            const fixture = yield* seedBridgeWithSourceExpense();
            yield* testSeedService.feeEntry(fixture.sourceExpense.id, 'bridge-source-fee', {
                accountId: fixture.sourceAccount.id,
                amount: SOURCE_FEE_AMOUNT
            });

            yield* runConsolidation();

            yield* expectConsolidationParent(fixture.sourceExpense.id, yield* fetchBridgeCanonicalId());
            yield* expectIbanBridgeBalances(fixture.accountIds, -IBAN_BRIDGE_EUR_AMOUNT - SOURCE_FEE_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT);
        })
    );

    it.effect('restores every claimed leg and the raw balances when the bridge canonical is reverted', () =>
        Effect.gen(function* () {
            const fixture = yield* seedBridgeWithSourceExpense();
            const targetIncome = yield* seedIbanBridgeTargetIncome(fixture.targetAccount.id, fixture.transferMccId);
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(fixture.accountIds);

            yield* runConsolidation();
            yield* expectNoTransferPair();

            yield* expectRevertRemovedCanonical(yield* revertSingleCanonical(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER), [
                fixture.bridgeIncome.id,
                fixture.bridgeExpense.id,
                fixture.sourceExpense.id,
                targetIncome.id
            ]);
            expect(yield* fetchLedgerBalances(fixture.accountIds)).toEqual(balancesBeforeConsolidation);
        })
    );
});
