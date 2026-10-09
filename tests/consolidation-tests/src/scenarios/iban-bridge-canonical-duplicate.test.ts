import { IbanBridgeTransferRepository } from '@budgie/consolidation';
import {
    CategorySourceEnum,
    ExternalSourceEnum,
    TransactionConsolidationTypeEnum,
    TransactionEntryEntityTable,
    TransactionEntityTable,
    TransactionUpdatedByEnum
} from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq, inArray } from 'drizzle-orm';
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
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_UAH_AMOUNT,
    expectIbanBridgeBalances,
    seedBridgeAddressedDuplicateBeforeCanonical,
    seedIbanBridgeCanonicalDuplicateFixture,
    seedIbanBridgeTargetIncome
} from '../harness/iban-bridge-topology';
import { expectSecondConsolidationRunStable, runConsolidation } from '../harness/run-consolidation';
import { rebuildStoredBalances, testDb, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

const DUPLICATED_LEG_COUNT = 2;

const fetchBridgeCanonicalId = () =>
    Effect.gen(function* () {
        return yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
    });

const countCanonicalDuplicateCandidates = Effect.fnUntraced(function* () {
    const ibanBridgeTransferRepository = yield* IbanBridgeTransferRepository;

    return (yield* ibanBridgeTransferRepository.findCanonicalDuplicateCandidates(null)).length;
});

const seedBridgeAddressedDuplicateAfterCanonical = Effect.fnUntraced(function* () {
    const fixture = yield* seedIbanBridgeCanonicalDuplicateFixture();

    yield* testDb
        .update(TransactionEntryEntityTable)
        .set({ toIban: fixture.bridgeAccount.iban })
        .where(eq(TransactionEntryEntityTable.transactionId, fixture.sourceExpense.id));
    yield* rebuildStoredBalances;
    expect(yield* countCanonicalDuplicateCandidates()).toBe(1);

    return { ...fixture, canonicalId: yield* fetchBridgeCanonicalId() };
});

layer(TestLayer)('consolidation/iban-bridge-canonical-duplicate absorption', it => {
    it.effect.each([0, 30, 60])(
        'absorbs repeated Monobank original records at a %s-second gap into their existing canonical',
        timeGapSeconds =>
            Effect.gen(function* () {
                const {
                    sourceExpense,
                    targetIncome,
                    bridgeIncome,
                    bridgeExpense,
                    originalSourceExpense,
                    originalTargetIncome,
                    sourceAccount,
                    bridgeAccount,
                    targetAccount
                } = yield* seedIbanBridgeCanonicalDuplicateFixture();

                yield* testDb
                    .update(TransactionEntityTable)
                    .set({ operatedAt: new Date(IBAN_BRIDGE_OPERATED_AT.getTime() + timeGapSeconds * 1000) })
                    .where(inArray(TransactionEntityTable.id, [sourceExpense.id, targetIncome.id]));
                const canonicalId = yield* fetchBridgeCanonicalId();
                const accountIds: [number, number, number] = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
                const balancesBeforeAbsorb = yield* fetchLedgerBalances(accountIds);

                const result = yield* runConsolidation();

                expect(result.consolidated).toBe(1);
                expect(yield* fetchBridgeCanonicalId()).toBe(canonicalId);
                yield* expectConsolidationParent(sourceExpense.id, canonicalId);
                yield* expectConsolidationParent(targetIncome.id, canonicalId);
                expect(yield* fetchMovedSourceIds(canonicalId)).toEqual(
                    [
                        bridgeIncome.id,
                        bridgeExpense.id,
                        originalSourceExpense.id,
                        originalTargetIncome.id,
                        sourceExpense.id,
                        targetIncome.id
                    ].sort((left, right) => left - right)
                );
                expect(balancesBeforeAbsorb).toEqual([
                    [sourceAccount.id, -DUPLICATED_LEG_COUNT * IBAN_BRIDGE_EUR_AMOUNT],
                    [bridgeAccount.id, 0],
                    [targetAccount.id, DUPLICATED_LEG_COUNT * IBAN_BRIDGE_UAH_AMOUNT]
                ]);
                yield* expectIbanBridgeBalances(accountIds, -IBAN_BRIDGE_EUR_AMOUNT, IBAN_BRIDGE_UAH_AMOUNT);
            })
    );

    it.effect('keeps unproven bridge-addressed sibling direct legs in a separate transfer canonical', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, sourceAccount, sourceExpense, bridgeAccount, targetAccount, targetIncome } =
                yield* seedBridgeAddressedDuplicateBeforeCanonical();
            const accountIds: [number, number, number] = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

            const result = yield* runConsolidation();
            const canonicalId = yield* fetchBridgeCanonicalId();

            expect(result.consolidated).toBe(2);
            const pairCanonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR);

            expect(pairCanonicalId).not.toBe(canonicalId);
            yield* expectConsolidationParent(bridgeExpense.id, canonicalId);
            yield* expectConsolidationParent(bridgeIncome.id, canonicalId);
            yield* expectConsolidationParent(sourceExpense.id, pairCanonicalId);
            yield* expectConsolidationParent(targetIncome.id, pairCanonicalId);
            expect(balancesBeforeConsolidation).toEqual([
                [sourceAccount.id, -IBAN_BRIDGE_EUR_AMOUNT],
                [bridgeAccount.id, 0],
                [targetAccount.id, IBAN_BRIDGE_UAH_AMOUNT]
            ]);
            yield* expectIbanBridgeBalances(accountIds, -2 * IBAN_BRIDGE_EUR_AMOUNT, 2 * IBAN_BRIDGE_UAH_AMOUNT);
            yield* expectSecondConsolidationRunStable();
        })
    );

    it.effect('skips ambiguous bridge-addressed equal-amount duplicate candidates with proven original identity', () =>
        Effect.gen(function* () {
            const fixture = yield* seedBridgeAddressedDuplicateAfterCanonical();

            expect(yield* countCanonicalDuplicateCandidates()).toBe(1);
            yield* seedIbanBridgeTargetIncome(fixture.targetAccount.id, fixture.transferMccId);
            yield* rebuildStoredBalances;

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );
});

layer(TestLayer)('consolidation/iban-bridge-canonical-duplicate guards', it => {
    it.effect.each(['missing', 'different'])('skips repeated records with %s source bank identity', identity =>
        Effect.gen(function* () {
            const { sourceExpense } = yield* seedBridgeAddressedDuplicateAfterCanonical();

            yield* testDb
                .update(TransactionEntityTable)
                .set({ externalId: identity === 'missing' ? null : 'another-bank-record' })
                .where(eq(TransactionEntityTable.id, sourceExpense.id));

            expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
        })
    );

    it.effect.each([ExternalSourceEnum.PRIVATBANK, ExternalSourceEnum.ERSTE])(
        'skips matching synthesized %s external identities',
        externalSource =>
            Effect.gen(function* () {
                const { originalSourceExpense, originalTargetIncome, sourceExpense, targetIncome } =
                    yield* seedBridgeAddressedDuplicateAfterCanonical();

                yield* testDb
                    .update(TransactionEntityTable)
                    .set({ externalSource })
                    .where(
                        inArray(TransactionEntityTable.id, [
                            originalSourceExpense.id,
                            originalTargetIncome.id,
                            sourceExpense.id,
                            targetIncome.id
                        ])
                    );

                expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
            })
    );

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
            const {
                bridgeAccount,
                bridgeExpense,
                bridgeIncome,
                originalSourceExpense,
                originalTargetIncome,
                sourceAccount,
                sourceExpense,
                targetAccount,
                targetIncome
            } = yield* seedIbanBridgeCanonicalDuplicateFixture();
            yield* runConsolidation();
            const canonicalId = yield* fetchBridgeCanonicalId();
            yield* unconsolidateById(canonicalId);

            yield* expectRevertRemovedCanonical(canonicalId, [
                bridgeIncome.id,
                bridgeExpense.id,
                originalSourceExpense.id,
                originalTargetIncome.id,
                sourceExpense.id,
                targetIncome.id
            ]);
            yield* expectIbanBridgeBalances(
                [sourceAccount.id, bridgeAccount.id, targetAccount.id],
                -2 * IBAN_BRIDGE_EUR_AMOUNT,
                2 * IBAN_BRIDGE_UAH_AMOUNT
            );
        })
    );
});
