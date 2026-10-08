import { IbanBridgeTransferRepository } from '@budgie/consolidation';
import {
    CategorySourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntityTable,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { expectRevertRemovedCanonical, fetchLedgerBalances, fetchSingleCanonicalId } from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_UAH_AMOUNT,
    expectBridgeCanonicalSources,
    expectIbanBridgeBalances,
    seedBridgeAddressedDuplicateBeforeCanonical,
    seedCompetingIbanBridgeCanonical,
    seedIbanBridgeCanonicalDuplicateFixture,
    seedIbanBridgeLegs,
    seedIbanBridgeSourceExpense,
    seedIbanBridgeTargetIncome,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { rebuildStoredBalances, testDb, testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

const DUPLICATED_LEG_COUNT = 2;

const fetchBridgeCanonicalId = () =>
    Effect.gen(function* () {
        return yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
    });

const expectNoTransferPairCanonical = Effect.fnUntraced(function* () {
    expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(0);
});

const countCanonicalDuplicateCandidates = Effect.fnUntraced(function* () {
    const ibanBridgeTransferRepository = yield* IbanBridgeTransferRepository;

    return (yield* ibanBridgeTransferRepository.findCanonicalDuplicateCandidates(null)).length;
});

const seedBridgeAddressedDuplicateAfterCanonical = Effect.fnUntraced(function* () {
    const topology = yield* seedIbanBridgeTopology();
    const legs = yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);

    yield* runConsolidation();

    const result = {
        ...topology,
        ...legs,
        canonicalId: yield* fetchBridgeCanonicalId(),
        sourceExpense: yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId, topology.bridgeAccount.iban),
        targetIncome: yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId)
    };

    yield* rebuildStoredBalances;

    return result;
});

layer(TestLayer)('consolidation/iban-bridge-canonical-duplicate absorption', it => {
    it.effect('absorbs late direct legs into the existing bridge canonical instead of building a second one', () =>
        Effect.gen(function* () {
            const { sourceExpense, targetIncome, bridgeIncome, bridgeExpense, sourceAccount, bridgeAccount, targetAccount } =
                yield* seedIbanBridgeCanonicalDuplicateFixture();
            const canonicalId = yield* fetchBridgeCanonicalId();
            const accountIds: [number, number, number] = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
            const balancesBeforeAbsorb = yield* fetchLedgerBalances(accountIds);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(1);
            expect(yield* fetchBridgeCanonicalId()).toBe(canonicalId);
            yield* expectBridgeCanonicalSources({
                bridgeExpenseId: bridgeExpense.id,
                bridgeIncomeId: bridgeIncome.id,
                canonicalId,
                sourceExpenseId: sourceExpense.id,
                targetIncomeId: targetIncome.id
            });
            expect(balancesBeforeAbsorb).toEqual([
                [sourceAccount.id, -DUPLICATED_LEG_COUNT * IBAN_BRIDGE_EUR_AMOUNT],
                [bridgeAccount.id, 0],
                [targetAccount.id, DUPLICATED_LEG_COUNT * IBAN_BRIDGE_UAH_AMOUNT]
            ]);
            yield* expectIbanBridgeBalances(accountIds, -IBAN_BRIDGE_EUR_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT);
        })
    );

    it.effect('absorbs bridge-addressed sibling direct legs in the same run that creates the bridge canonical', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, sourceAccount, sourceExpense, bridgeAccount, targetAccount, targetIncome } =
                yield* seedBridgeAddressedDuplicateBeforeCanonical();
            const accountIds: [number, number, number] = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

            const result = yield* runConsolidation();
            const canonicalId = yield* fetchBridgeCanonicalId();

            expect(result.consolidated).toBe(2);
            yield* expectNoTransferPairCanonical();
            yield* expectBridgeCanonicalSources({
                bridgeExpenseId: bridgeExpense.id,
                bridgeIncomeId: bridgeIncome.id,
                canonicalId,
                sourceExpenseId: sourceExpense.id,
                targetIncomeId: targetIncome.id
            });
            expect(balancesBeforeConsolidation).toEqual([
                [sourceAccount.id, -IBAN_BRIDGE_EUR_AMOUNT],
                [bridgeAccount.id, 0],
                [targetAccount.id, IBAN_BRIDGE_UAH_AMOUNT]
            ]);
            yield* expectIbanBridgeBalances(accountIds, -IBAN_BRIDGE_EUR_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('skips ambiguous bridge-addressed equal-amount duplicate candidates', () =>
        Effect.gen(function* () {
            const topology = yield* seedIbanBridgeTopology();

            yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);
            yield* runConsolidation();
            yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId, topology.bridgeAccount.iban);
            yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId);
            yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId);

            yield* seedCompetingIbanBridgeCanonical({
                bridgeAccountId: topology.bridgeAccount.id,
                bridgeIban: topology.bridgeAccount.iban,
                sourceAccountId: topology.sourceAccount.id,
                sourceIban: topology.sourceAccount.iban,
                targetAccountId: topology.targetAccount.id,
                targetIban: topology.targetAccount.iban,
                transferMccId: topology.transferMccId
            });
            yield* rebuildStoredBalances;

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );
});

layer(TestLayer)('consolidation/iban-bridge-canonical-duplicate guards', it => {
    it.effect('skips edited bridge-addressed canonical duplicate candidates', () =>
        Effect.gen(function* () {
            const { canonicalId } = yield* seedBridgeAddressedDuplicateAfterCanonical();

            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, canonicalId));

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );

    it.effect('skips edited bridge-addressed origin duplicate candidates', () =>
        Effect.gen(function* () {
            const { bridgeIncome } = yield* seedBridgeAddressedDuplicateAfterCanonical();

            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, bridgeIncome.id));

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );

    it.effect.each(['source', 'target'])('skips edited bridge-addressed %s duplicate candidates', sourceType =>
        Effect.gen(function* () {
            const { sourceExpense, targetIncome } = yield* seedBridgeAddressedDuplicateAfterCanonical();

            yield* testDb
                .update(TransactionEntityTable)
                .set({ updatedBy: TransactionUpdatedByEnum.USER })
                .where(eq(TransactionEntityTable.id, sourceType === 'source' ? sourceExpense.id : targetIncome.id));

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );

    it.effect('skips fee-bearing bridge-addressed duplicate candidates', () =>
        Effect.gen(function* () {
            const { sourceAccount, sourceExpense } = yield* seedBridgeAddressedDuplicateAfterCanonical();

            yield* testSeedService.feeEntry(sourceExpense.id, 'bridge-addressed-fee', {
                accountId: sourceAccount.id,
                amount: 1
            });
            yield* rebuildStoredBalances;

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );

    it.effect('skips category-source fee bridge-addressed duplicate candidates', () =>
        Effect.gen(function* () {
            const { sourceExpense } = yield* seedBridgeAddressedDuplicateAfterCanonical();
            const feeCategory = yield* testSeedService.category('Bridge addressed fee category');
            const [entry] = yield* testDb
                .select({ id: TransactionEntryEntityTable.id })
                .from(TransactionEntryEntityTable)
                .where(eq(TransactionEntryEntityTable.transactionId, sourceExpense.id));

            yield* testSeedService.entryCategory(entry.id, feeCategory.id, CategorySourceEnum.FEE);

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );
});

layer(TestLayer)('consolidation/iban-bridge-canonical-duplicate revert', it => {
    it.effect('restores every absorbed and original leg when the shared canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeExpense, bridgeIncome, sourceAccount, sourceExpense, targetAccount, targetIncome } =
                yield* seedIbanBridgeCanonicalDuplicateFixture();
            const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];

            yield* runConsolidation();
            const canonicalId = yield* fetchBridgeCanonicalId();
            const balancesAfterAbsorb = yield* fetchLedgerBalances(accountIds);
            yield* unconsolidateById(canonicalId);

            yield* expectRevertRemovedCanonical(canonicalId, [bridgeIncome.id, bridgeExpense.id, sourceExpense.id, targetIncome.id]);
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesAfterAbsorb);
        })
    );
});
