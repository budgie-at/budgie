import { SyncModeEnum, TransactionEntryEntityTable, TransactionEntryTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { fetchLedgerBalances } from '../harness/consolidation-revert-audit';
import {
    seedIbanBridgeCompensatingAdjustment,
    stampIbanBridgeTransactions,
    touchIbanBridgeAdjustments
} from '../harness/iban-bridge-supersession-fixture';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_UAH_AMOUNT,
    countCanonicalDuplicateCandidates,
    expectIbanBridgeBalances,
    fetchBridgeCanonicalId,
    seedIbanBridgeCanonicalDuplicateFixture
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { rebuildStoredBalances, testDb, testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const HISTORICAL_CREATED_AT = Math.floor(new Date('2026-05-20T18:39:00Z').getTime() / 1000);
const CALIBRATION_CREATED_AT = HISTORICAL_CREATED_AT + 300;
const POST_CALIBRATION_CREATED_AT = CALIBRATION_CREATED_AT + 300;
const LATER_RECALIBRATION_AT = POST_CALIBRATION_CREATED_AT + 300;
const BRIDGE_ADDRESSING = [true, false];
const BOTH_LEGS_CALIBRATED = [TransactionEntryTypeEnum.CREDIT, TransactionEntryTypeEnum.DEBIT];

const seedCalibratedDuplicate = Effect.fnUntraced(function* (
    bridgeAddressed: boolean,
    duplicateCreatedAt: number,
    calibratedEntryTypes: readonly TransactionEntryTypeEnum[]
) {
    const fixture = yield* seedIbanBridgeCanonicalDuplicateFixture();

    if (bridgeAddressed) {
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ toIban: fixture.bridgeAccount.iban })
            .where(eq(TransactionEntryEntityTable.transactionId, fixture.sourceExpense.id));
    }
    yield* stampIbanBridgeTransactions(
        [fixture.bridgeIncome.id, fixture.bridgeExpense.id, fixture.originalSourceExpense.id, fixture.originalTargetIncome.id],
        HISTORICAL_CREATED_AT
    );
    yield* stampIbanBridgeTransactions([fixture.sourceExpense.id, fixture.targetIncome.id], duplicateCreatedAt);
    if (calibratedEntryTypes.includes(TransactionEntryTypeEnum.CREDIT)) {
        yield* seedIbanBridgeCompensatingAdjustment(fixture.sourceAccount.id, IBAN_BRIDGE_EUR_AMOUNT, CALIBRATION_CREATED_AT);
    }
    if (calibratedEntryTypes.includes(TransactionEntryTypeEnum.DEBIT)) {
        yield* seedIbanBridgeCompensatingAdjustment(fixture.targetAccount.id, -IBAN_BRIDGE_UAH_AMOUNT, CALIBRATION_CREATED_AT);
    }
    yield* rebuildStoredBalances;

    const accountIds: [number, number, number] = [fixture.sourceAccount.id, fixture.bridgeAccount.id, fixture.targetAccount.id];

    return { ...fixture, canonicalId: yield* fetchBridgeCanonicalId(), accountIds };
});

const expectCalibratedDuplicatesUntouched = Effect.fnUntraced(function* ({
    accountIds,
    canonicalId,
    sourceExpense,
    targetIncome
}: Effect.Success<ReturnType<typeof seedCalibratedDuplicate>>) {
    const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);

    expect(yield* countCanonicalDuplicateCandidates()).toBe(0);
    yield* runConsolidation();
    expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
    for (const duplicate of [sourceExpense, targetIncome]) {
        expect((yield* testQueryService.fetchTransactionById(duplicate.id)).consolidationParentTransactionId).not.toBe(canonicalId);
    }
});

layer(TestLayer)('consolidation/iban-bridge-canonical-duplicate calibration', it => {
    it.effect.each(BRIDGE_ADDRESSING)(
        'keeps duplicates imported before calibration out of the canonical (bridge addressed: %s)',
        bridgeAddressed =>
            Effect.gen(function* () {
                yield* expectCalibratedDuplicatesUntouched(
                    yield* seedCalibratedDuplicate(bridgeAddressed, HISTORICAL_CREATED_AT, BOTH_LEGS_CALIBRATED)
                );
            })
    );

    it.effect.each(BRIDGE_ADDRESSING)(
        'keeps duplicates out of the canonical when the adjustment was recalibrated after import (bridge addressed: %s)',
        bridgeAddressed =>
            Effect.gen(function* () {
                const fixture = yield* seedCalibratedDuplicate(bridgeAddressed, POST_CALIBRATION_CREATED_AT, BOTH_LEGS_CALIBRATED);

                yield* touchIbanBridgeAdjustments(LATER_RECALIBRATION_AT);
                yield* expectCalibratedDuplicatesUntouched(fixture);
            })
    );

    it.effect.each(BRIDGE_ADDRESSING)('absorbs duplicates imported after calibration (bridge addressed: %s)', bridgeAddressed =>
        Effect.gen(function* () {
            const { accountIds } = yield* seedCalibratedDuplicate(bridgeAddressed, POST_CALIBRATION_CREATED_AT, BOTH_LEGS_CALIBRATED);

            expect(yield* countCanonicalDuplicateCandidates()).toBe(1);
            expect((yield* runConsolidation()).consolidated).toBe(1);
            yield* expectIbanBridgeBalances(accountIds, 0, 0);
        })
    );

    it.effect.each([TransactionEntryTypeEnum.CREDIT, TransactionEntryTypeEnum.DEBIT])(
        'keeps duplicates out of the canonical when only the %s leg is calibrated',
        calibratedEntryType =>
            Effect.gen(function* () {
                yield* expectCalibratedDuplicatesUntouched(
                    yield* seedCalibratedDuplicate(true, HISTORICAL_CREATED_AT, [calibratedEntryType])
                );
            })
    );

    it.effect('keeps duplicates out of the canonical when the forward sync has no balance adjustment', () =>
        Effect.gen(function* () {
            const fixture = yield* seedCalibratedDuplicate(false, HISTORICAL_CREATED_AT, []);

            yield* testSeedService.sync({
                accountId: fixture.sourceAccount.id,
                forwardSyncFromAt: new Date(CALIBRATION_CREATED_AT * 1000),
                mode: SyncModeEnum.FORWARD
            });
            yield* expectCalibratedDuplicatesUntouched(fixture);
        })
    );
});
