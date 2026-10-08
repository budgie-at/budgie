import {
    AccountBalanceRepository,
    AccountEntityInterface,
    PRECISION,
    TransactionEntityTable,
    TransactionEntryEntityTable
} from '@budgie/contracts';
import { AccountBalanceIncrementalService } from '@budgie/ledger';
import { TransferConsolidationService } from '@budgie/sync';
import { expect } from '@effect/vitest';
import { eq } from 'drizzle-orm';
import * as Effect from 'effect/Effect';

import { applyMigration, seed, seedBankPair, testDb, TestLayer } from '../../harness';

import {
    DUPLICATE_CREATED_AT,
    DUPLICATE_OPERATED_AT,
    DUPLICATE_TRANSFER_REPAIR_MIGRATION,
    PRE_ADJUSTMENT_CREATED_AT,
    SOURCE_AMOUNT,
    TARGET_AMOUNT
} from './data-migration-money-impact.constant';
import {
    applyMigrationAndExpectComputedCompetingGroup,
    applyMigrationAndExpectComputedDuplicatePair,
    expectCompetingCanonicalGroupVisible,
    expectComputedBalances,
    expectDuplicatePairStillVisible,
    expectStoredBalances,
    expectVisibleCanonicalTransfers,
    fetchMovedEntryCount,
    fetchTransactionTagCount
} from './duplicate-transfer-repair-assertion';
import {
    markTransactionUpdatedByUser,
    prepareDuplicateTransferRepairFixture,
    seedAdjustedDuplicatePair,
    seedCompetingTransferPairCanonical,
    seedDuplicateCanonicalPair,
    stampTransactions,
    upsertRepairStoredBalances
} from './duplicate-transfer-repair-fixture';
import { seedLedgerFixture } from './migration-money-impact-ledger-fixture';

const seedCompetingCanonicalForFixture = (
    fixture: {
        readonly sourceAccount: AccountEntityInterface;
        readonly targetAccount: AccountEntityInterface;
        readonly bridgeAccount: AccountEntityInterface;
        readonly sourceIban: string;
        readonly targetIban: string;
        readonly bridgeIban: string;
    },
    suffix: string
) =>
    seedCompetingTransferPairCanonical({
        sourceAccountId: fixture.sourceAccount.id,
        targetAccountId: fixture.targetAccount.id,
        bridgeAccountId: fixture.bridgeAccount.id,
        sourceIban: fixture.sourceIban,
        targetIban: fixture.targetIban,
        bridgeIban: fixture.bridgeIban,
        suffix
    });

const applyMigrationAndExpectPreparedDuplicatePair = (input: {
    readonly sourceAccount: AccountEntityInterface;
    readonly targetAccount: AccountEntityInterface;
    readonly bridgeCanonicalId: number;
    readonly pairCanonicalId: number;
}) =>
    applyMigrationAndExpectComputedDuplicatePair({
        sourceAccountId: input.sourceAccount.id,
        targetAccountId: input.targetAccount.id,
        bridgeCanonicalId: input.bridgeCanonicalId,
        pairCanonicalId: input.pairCanonicalId
    });

export const unchangedLedgerScenario = (migrationName: string) =>
    Effect.gen(function* () {
        const accountBalanceRepository = yield* AccountBalanceRepository;
        const accountBalanceIncrementalService = yield* AccountBalanceIncrementalService;
        const transferConsolidationService = yield* TransferConsolidationService;
        const accountIds = yield* seedLedgerFixture();
        yield* transferConsolidationService.consolidate(null);
        const ledgerBefore = yield* accountBalanceRepository.getLedgerBalances(accountIds);

        yield* applyMigration(migrationName);
        yield* transferConsolidationService.consolidate(null);
        yield* accountBalanceIncrementalService.updateAllBalances(false);

        expect(yield* accountBalanceRepository.getLedgerBalances(accountIds)).toEqual(ledgerBefore);
    }).pipe(Effect.provide(TestLayer));

export const repairDuplicateTransferScenario = () =>
    Effect.gen(function* () {
        const { sourceAccount, targetAccount, duplicate, hiddenTag } = yield* prepareDuplicateTransferRepairFixture();

        yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
        yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
        yield* expectComputedBalances({
            sourceAccountId: sourceAccount.id,
            targetAccountId: targetAccount.id,
            sourceBalance: -SOURCE_AMOUNT,
            targetBalance: TARGET_AMOUNT
        });
        yield* expectVisibleCanonicalTransfers({
            transactionIds: [duplicate.bridge.canonical.id, duplicate.pair.canonical.id],
            expectedCount: 1
        });
        expect(yield* fetchMovedEntryCount(duplicate.bridge.canonical.id)).toBe(4);
        expect(yield* fetchMovedEntryCount(duplicate.pair.canonical.id)).toBe(0);
        expect(yield* fetchTransactionTagCount(duplicate.bridge.canonical.id, hiddenTag.id)).toBe(1);
    }).pipe(Effect.provide(TestLayer));

export const ambiguousDuplicateTransferScenario = () =>
    Effect.gen(function* () {
        const fixture = yield* seedAdjustedDuplicatePair('ambiguous', 'ambiguous-a');
        const second = yield* seedDuplicateCanonicalPair({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            bridgeAccountId: fixture.bridgeAccount.id,
            sourceIban: fixture.sourceIban,
            targetIban: fixture.targetIban,
            bridgeIban: fixture.bridgeIban,
            amountSuffix: 'ambiguous-b'
        });

        yield* upsertRepairStoredBalances({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            sourceAmount: -4 * SOURCE_AMOUNT,
            targetAmount: 4 * TARGET_AMOUNT
        });
        yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
        yield* expectComputedBalances({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            sourceBalance: -4 * SOURCE_AMOUNT,
            targetBalance: 4 * TARGET_AMOUNT
        });
        yield* expectVisibleCanonicalTransfers({
            transactionIds: [
                fixture.duplicate.bridge.canonical.id,
                fixture.duplicate.pair.canonical.id,
                second.bridge.canonical.id,
                second.pair.canonical.id
            ],
            expectedCount: 4
        });
    }).pipe(Effect.provide(TestLayer));

export const feeBearingCompetingCanonicalScenario = () =>
    Effect.gen(function* () {
        const fixture = yield* seedAdjustedDuplicatePair('fee', 'fee');
        const competing = yield* seedCompetingCanonicalForFixture(fixture, 'fee-competing');

        yield* seed.feeEntry(competing.canonical.id, 'repair-fee-extra', { accountId: fixture.sourceAccount.id, amount: PRECISION });
        yield* upsertRepairStoredBalances({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            sourceAmount: -3 * SOURCE_AMOUNT - PRECISION,
            targetAmount: 3 * TARGET_AMOUNT
        });
        yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
        yield* expectStoredBalances({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            sourceBalance: -3 * SOURCE_AMOUNT - PRECISION,
            targetBalance: 3 * TARGET_AMOUNT
        });
        yield* expectCompetingCanonicalGroupVisible({
            bridgeCanonicalId: fixture.duplicate.bridge.canonical.id,
            pairCanonicalId: fixture.duplicate.pair.canonical.id,
            competingCanonicalId: competing.canonical.id
        });
    }).pipe(Effect.provide(TestLayer));

export const editedCompetingCanonicalScenario = () =>
    Effect.gen(function* () {
        const fixture = yield* seedAdjustedDuplicatePair('edited-third', 'edited-third');
        const competing = yield* seedCompetingCanonicalForFixture(fixture, 'edited-third-competing');

        yield* markTransactionUpdatedByUser(competing.canonical.id);
        yield* upsertRepairStoredBalances({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            sourceAmount: -3 * SOURCE_AMOUNT,
            targetAmount: 3 * TARGET_AMOUNT
        });
        yield* applyMigrationAndExpectComputedCompetingGroup({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            bridgeCanonicalId: fixture.duplicate.bridge.canonical.id,
            pairCanonicalId: fixture.duplicate.pair.canonical.id,
            competingCanonicalId: competing.canonical.id,
            sourceBalance: -3 * SOURCE_AMOUNT,
            targetBalance: 3 * TARGET_AMOUNT
        });
    }).pipe(Effect.provide(TestLayer));

export const staleBalanceSnapshotScenario = () =>
    Effect.gen(function* () {
        const { sourceAccount, targetAccount, duplicate } = yield* prepareDuplicateTransferRepairFixture();

        yield* upsertRepairStoredBalances({
            sourceAccountId: sourceAccount.id,
            targetAccountId: targetAccount.id,
            sourceAmount: -2 * SOURCE_AMOUNT,
            targetAmount: 2 * TARGET_AMOUNT,
            updatedAt: DUPLICATE_CREATED_AT - 1
        });
        yield* applyMigration(DUPLICATE_TRANSFER_REPAIR_MIGRATION);
        yield* expectStoredBalances({
            sourceAccountId: sourceAccount.id,
            targetAccountId: targetAccount.id,
            sourceBalance: -2 * SOURCE_AMOUNT,
            targetBalance: 2 * TARGET_AMOUNT
        });
        yield* expectDuplicatePairStillVisible({
            bridgeCanonicalId: duplicate.bridge.canonical.id,
            pairCanonicalId: duplicate.pair.canonical.id
        });
    }).pipe(Effect.provide(TestLayer));

export const malformedBridgeTopologyScenario = () =>
    Effect.gen(function* () {
        const { sourceAccount, targetAccount, duplicate } = yield* prepareDuplicateTransferRepairFixture();

        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ toIban: 'UA-WRONG-TARGET' })
            .where(eq(TransactionEntryEntityTable.transactionId, duplicate.bridge.canonical.id));
        yield* applyMigrationAndExpectPreparedDuplicatePair({
            sourceAccount,
            targetAccount,
            bridgeCanonicalId: duplicate.bridge.canonical.id,
            pairCanonicalId: duplicate.pair.canonical.id
        });
    }).pipe(Effect.provide(TestLayer));

export const editedOriginalTransactionScenario = () =>
    Effect.gen(function* () {
        const { sourceAccount, targetAccount, duplicate } = yield* prepareDuplicateTransferRepairFixture();

        yield* markTransactionUpdatedByUser(duplicate.pair.originals.expense.id);
        yield* applyMigrationAndExpectPreparedDuplicatePair({
            sourceAccount,
            targetAccount,
            bridgeCanonicalId: duplicate.bridge.canonical.id,
            pairCanonicalId: duplicate.pair.canonical.id
        });
    }).pipe(Effect.provide(TestLayer));

export const extraEditedMovedOriginalScenario = () =>
    Effect.gen(function* () {
        const { sourceAccount, targetAccount, duplicate, bridgeIban } = yield* prepareDuplicateTransferRepairFixture();
        const extraOriginal = yield* seedBankPair.expense(
            { externalId: 'repair-extra-edited-original', operatedAt: DUPLICATE_OPERATED_AT },
            { accountId: sourceAccount.id, amount: SOURCE_AMOUNT, toIban: bridgeIban }
        );

        yield* stampTransactions([extraOriginal.id], DUPLICATE_CREATED_AT);
        yield* testDb
            .update(TransactionEntityTable)
            .set({ consolidationParentTransactionId: duplicate.pair.canonical.id })
            .where(eq(TransactionEntityTable.id, extraOriginal.id));
        yield* markTransactionUpdatedByUser(extraOriginal.id);
        yield* testDb
            .update(TransactionEntryEntityTable)
            .set({ transactionId: duplicate.pair.canonical.id, originalTransactionId: extraOriginal.id })
            .where(eq(TransactionEntryEntityTable.transactionId, extraOriginal.id));
        yield* upsertRepairStoredBalances({
            sourceAccountId: sourceAccount.id,
            targetAccountId: targetAccount.id,
            sourceAmount: -2 * SOURCE_AMOUNT,
            targetAmount: 2 * TARGET_AMOUNT
        });
        yield* applyMigrationAndExpectPreparedDuplicatePair({
            sourceAccount,
            targetAccount,
            bridgeCanonicalId: duplicate.bridge.canonical.id,
            pairCanonicalId: duplicate.pair.canonical.id
        });
        expect(yield* fetchMovedEntryCount(duplicate.pair.canonical.id)).toBe(3);
    }).pipe(Effect.provide(TestLayer));

export const preCalibrationDuplicateScenario = () =>
    Effect.gen(function* () {
        const fixture = yield* seedAdjustedDuplicatePair('stale', 'stale', PRE_ADJUSTMENT_CREATED_AT);

        yield* upsertRepairStoredBalances({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            sourceAmount: -2 * SOURCE_AMOUNT,
            targetAmount: 2 * TARGET_AMOUNT
        });
        yield* applyMigrationAndExpectComputedDuplicatePair({
            sourceAccountId: fixture.sourceAccount.id,
            targetAccountId: fixture.targetAccount.id,
            bridgeCanonicalId: fixture.duplicate.bridge.canonical.id,
            pairCanonicalId: fixture.duplicate.pair.canonical.id
        });
    }).pipe(Effect.provide(TestLayer));
