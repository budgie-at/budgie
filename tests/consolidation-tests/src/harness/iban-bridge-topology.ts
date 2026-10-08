import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { sql } from 'drizzle-orm';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { expectConsolidationParent, fetchLedgerBalances, fetchLedgerEntry, fetchMovedSourceIds } from './consolidation-revert-audit';
import { runConsolidation } from './run-consolidation';
import { testDb, testQueryService, testSeedService } from './test-context';

export const IBAN_BRIDGE_SOURCE_IBAN = 'UA-RECLAIM-SOURCE-EUR';
export const IBAN_BRIDGE_TARGET_IBAN = 'UA-RECLAIM-TARGET-UAH';
const IBAN_BRIDGE_BRIDGE_IBAN = 'UA-RECLAIM-BRIDGE-UAH';
export const IBAN_BRIDGE_EUR_AMOUNT = 1_658_290_000;
export const IBAN_BRIDGE_UAH_AMOUNT = 84_456_700_000;
export const IBAN_BRIDGE_UAH_TO_EUR_RATE = IBAN_BRIDGE_EUR_AMOUNT / IBAN_BRIDGE_UAH_AMOUNT;
const IBAN_BRIDGE_EUR_TO_UAH_RATE = IBAN_BRIDGE_UAH_AMOUNT / IBAN_BRIDGE_EUR_AMOUNT;
export const IBAN_BRIDGE_OPERATED_AT = new Date('2026-05-20T18:38:00');
export const IBAN_BRIDGE_TRANSFER_MCC = '4829';

const byTransactionId = (left: number, right: number): number => left - right;

export const seedIbanBridgeTopology = () =>
    Effect.gen(function* () {
        const eur = yield* testSeedService.instrument({ code: 'EUR', name: 'Euro', symbol: 'EUR' });

        return {
            sourceAccount: yield* testSeedService.bankSyncAccount('Reclaim Source EUR', null, IBAN_BRIDGE_SOURCE_IBAN, eur.id),
            bridgeAccount: yield* testSeedService.bankSyncAccount('Reclaim Bridge UAH', null, IBAN_BRIDGE_BRIDGE_IBAN),
            targetAccount: yield* testSeedService.bankSyncAccount('Reclaim Target UAH', null, IBAN_BRIDGE_TARGET_IBAN),
            transferMccId: (yield* testQueryService.findMccByCode(IBAN_BRIDGE_TRANSFER_MCC)).id
        };
    });

export const seedIbanBridgeIncomeLeg = (bridgeAccountId: number, transferMccId: number) =>
    Effect.gen(function* () {
        return yield* testSeedService.bankPairIncome(
            { externalId: 'reclaim-bridge-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
            {
                accountId: bridgeAccountId,
                amount: IBAN_BRIDGE_UAH_AMOUNT,
                exchangeRate: IBAN_BRIDGE_EUR_TO_UAH_RATE,
                mccCategoryId: transferMccId,
                toIban: IBAN_BRIDGE_SOURCE_IBAN
            }
        );
    });

const seedIbanBridgeExpenseLeg = (bridgeAccountId: number, transferMccId: number) =>
    Effect.gen(function* () {
        return yield* testSeedService.bankPairExpense(
            { externalId: 'reclaim-bridge-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
            {
                accountId: bridgeAccountId,
                amount: IBAN_BRIDGE_UAH_AMOUNT,
                mccCategoryId: transferMccId,
                toIban: IBAN_BRIDGE_TARGET_IBAN
            }
        );
    });

export const seedIbanBridgeLegs = (bridgeAccountId: number, transferMccId: number) =>
    Effect.gen(function* () {
        return {
            bridgeIncome: yield* seedIbanBridgeIncomeLeg(bridgeAccountId, transferMccId),
            bridgeExpense: yield* seedIbanBridgeExpenseLeg(bridgeAccountId, transferMccId)
        };
    });

export const seedIbanBridgeSourceExpense = (
    sourceAccountId: number,
    transferMccId: number,
    toIban: string | null = IBAN_BRIDGE_TARGET_IBAN
) =>
    Effect.gen(function* () {
        return yield* testSeedService.bankPairExpense(
            { externalId: 'reclaim-source-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
            {
                accountId: sourceAccountId,
                amount: IBAN_BRIDGE_EUR_AMOUNT,
                exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
                mccCategoryId: transferMccId,
                toIban
            }
        );
    });

export const seedIbanBridgeTargetIncome = (targetAccountId: number, transferMccId: number) =>
    Effect.gen(function* () {
        return yield* testSeedService.bankPairIncome(
            { externalId: 'reclaim-target-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
            {
                accountId: targetAccountId,
                amount: IBAN_BRIDGE_UAH_AMOUNT,
                mccCategoryId: transferMccId
            }
        );
    });

export const seedIbanBridgeCanonicalTransfer = (sourceAccountId: number, targetAccountId: number, toIban: string | null) =>
    testSeedService.directTransfer({
        consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
        exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
        operatedAt: IBAN_BRIDGE_OPERATED_AT,
        sourceAccountId,
        sourceAmount: IBAN_BRIDGE_EUR_AMOUNT,
        sourceEntryExchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
        targetAccountId,
        targetAmount: IBAN_BRIDGE_UAH_AMOUNT,
        toIban
    });

export const parentConsolidationSource = (sourceTransactionId: number, canonicalTransactionId: number) =>
    Effect.gen(function* () {
        yield* testDb.run(
            sql`UPDATE transaction_entries SET original_transaction_id = ${sourceTransactionId}, transaction_id = ${canonicalTransactionId} WHERE transaction_id = ${sourceTransactionId}`
        );
        yield* testDb.run(
            sql`UPDATE transactions SET consolidation_parent_transaction_id = ${canonicalTransactionId} WHERE id = ${sourceTransactionId}`
        );
    });

export const seedBridgeAddressedDuplicateBeforeCanonical = Effect.fnUntraced(function* () {
    const topology = yield* seedIbanBridgeTopology();
    const legs = yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);

    return {
        ...topology,
        ...legs,
        sourceExpense: yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId, topology.bridgeAccount.iban),
        targetIncome: yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId)
    };
});

export const seedCompetingIbanBridgeCanonical = Effect.fnUntraced(function* ({
    bridgeAccountId,
    bridgeIban,
    sourceAccountId,
    sourceIban,
    targetAccountId,
    targetIban,
    transferMccId
}: {
    readonly bridgeAccountId: number;
    readonly bridgeIban: string | null;
    readonly sourceAccountId: number;
    readonly sourceIban: string | null;
    readonly targetAccountId: number;
    readonly targetIban: string | null;
    readonly transferMccId: number;
}) {
    const competingBridgeIncome = yield* testSeedService.bankPairIncome(
        { externalId: 'competing-bridge-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: bridgeAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_EUR_TO_UAH_RATE,
            mccCategoryId: transferMccId,
            toIban: sourceIban
        }
    );
    const competingBridgeExpense = yield* testSeedService.bankPairExpense(
        { externalId: 'competing-bridge-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: bridgeAccountId,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            mccCategoryId: transferMccId,
            toIban: targetIban
        }
    );
    const competingCanonical = yield* seedIbanBridgeCanonicalTransfer(sourceAccountId, targetAccountId, bridgeIban);

    yield* parentConsolidationSource(competingBridgeIncome.id, competingCanonical.id);
    yield* parentConsolidationSource(competingBridgeExpense.id, competingCanonical.id);
});

export const expectBridgeCanonicalSources = Effect.fnUntraced(function* ({
    bridgeExpenseId,
    bridgeIncomeId,
    canonicalId,
    sourceExpenseId,
    targetIncomeId
}: {
    readonly bridgeExpenseId: number;
    readonly bridgeIncomeId: number;
    readonly canonicalId: number;
    readonly sourceExpenseId: number;
    readonly targetIncomeId: number;
}) {
    yield* expectConsolidationParent(sourceExpenseId, canonicalId);
    yield* expectConsolidationParent(targetIncomeId, canonicalId);
    expect(yield* fetchMovedSourceIds(canonicalId)).toEqual(
        [bridgeIncomeId, bridgeExpenseId, sourceExpenseId, targetIncomeId].sort(byTransactionId)
    );
});

export const expectIbanBridgeBalances = Effect.fnUntraced(function* (
    accountIds: [number, number, number],
    sourceAmount: number,
    targetAmount: number
) {
    expect(yield* fetchLedgerBalances(accountIds)).toEqual([
        [accountIds[0], sourceAmount],
        [accountIds[1], 0],
        [accountIds[2], targetAmount]
    ]);
});

export const seedIbanBridgeCanonicalDuplicateFixture = Effect.fnUntraced(function* () {
    const topology = yield* seedIbanBridgeTopology();
    const legs = yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId);

    yield* runConsolidation();

    return {
        ...topology,
        ...legs,
        sourceExpense: yield* seedIbanBridgeSourceExpense(topology.sourceAccount.id, topology.transferMccId),
        targetIncome: yield* seedIbanBridgeTargetIncome(topology.targetAccount.id, topology.transferMccId)
    };
});

export const expectBridgeLedgerAmounts = (canonicalId: number, sourceAccountId: number, targetAccountId: number) =>
    Effect.gen(function* () {
        expect((yield* fetchLedgerEntry(canonicalId, sourceAccountId)).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
        expect((yield* fetchLedgerEntry(canonicalId, targetAccountId)).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
    });
