import { consolidationScopeService } from '@budgie/consolidation';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    expectConsolidationParent,
    expectSourcesRestored,
    fetchLedgerBalances,
    fetchLedgerEntry,
    fetchOwnLedgerEntries
} from '../harness/consolidation-revert-audit';
import {
    seedIbanBridgeBalanceAdjustment,
    seedIbanBridgePrefixArrival,
    seedIbanBridgeSupersessionCompleteRoute,
    stampIbanBridgeTransactions
} from '../harness/iban-bridge-supersession-fixture';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_SOURCE_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_UAH_TO_EUR_RATE,
    parentConsolidationSource,
    seedIbanBridgeCanonicalTransfer,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

const TECHNICAL_BRIDGE_IBAN = 'UA-SUPERSESSION-TECHNICAL-UAH';
const COMPETING_TECHNICAL_BRIDGE_IBAN = 'UA-SUPERSESSION-COMPETING-UAH';
const DISTINCT_SOURCE_AMOUNT_OFFSET = 10_000_000;
const DISTINCT_SOURCE_AMOUNT = IBAN_BRIDGE_EUR_AMOUNT + DISTINCT_SOURCE_AMOUNT_OFFSET;
const COMPETING_PREFIX_OFFSET_MS = 30_000;
const HISTORICAL_CREATED_AT = Math.floor(new Date('2026-05-20T18:39:00Z').getTime() / 1000);
const CALIBRATION_CREATED_AT = HISTORICAL_CREATED_AT + 300;
const POST_CALIBRATION_CREATED_AT = CALIBRATION_CREATED_AT + 300;

const seedManualSupersessionCandidate = Effect.fnUntraced(function* () {
    const topology = yield* seedIbanBridgeTopology();
    const supersededCanonical = yield* seedIbanBridgeCanonicalTransfer(
        topology.sourceAccount.id,
        topology.bridgeAccount.id,
        topology.bridgeAccount.iban
    );
    const canonical = yield* seedIbanBridgeCanonicalTransfer(
        topology.sourceAccount.id,
        topology.targetAccount.id,
        topology.bridgeAccount.iban
    );
    const bridgeIncome = yield* testSeedService.bankPairIncome(
        { externalId: 'calibrated-bridge-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: topology.bridgeAccount.id,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: topology.transferMccId,
            toIban: IBAN_BRIDGE_SOURCE_IBAN
        }
    );

    yield* parentConsolidationSource(bridgeIncome.id, canonical.id);

    return { ...topology, bridgeIncome, canonical, supersededCanonical };
});

const seedIncrementalBridgeArrival = Effect.fnUntraced(function* ({
    completeSourceAmount = IBAN_BRIDGE_EUR_AMOUNT,
    scopeArrivalToSyncedTransactions = false,
    withCompetingPrefix = false
}: {
    readonly completeSourceAmount?: number;
    readonly scopeArrivalToSyncedTransactions?: boolean;
    readonly withCompetingPrefix?: boolean;
} = {}) {
    const topology = yield* seedIbanBridgeTopology();
    const technicalBridgeAccount = yield* testSeedService.bankSyncAccount('Supersession Technical UAH', null, TECHNICAL_BRIDGE_IBAN);

    const prefixSourceTransactionIds = yield* seedIbanBridgePrefixArrival({
        bridgeIban: topology.bridgeAccount.iban,
        externalIdPrefix: 'supersession-prefix',
        operatedAt: IBAN_BRIDGE_OPERATED_AT,
        technicalBridgeAccountId: technicalBridgeAccount.id,
        transferMccId: topology.transferMccId
    });

    if (withCompetingPrefix) {
        yield* seedIbanBridgePrefixArrival({
            bridgeIban: topology.bridgeAccount.iban,
            externalIdPrefix: 'supersession-competing-prefix',
            operatedAt: new Date(IBAN_BRIDGE_OPERATED_AT.getTime() + COMPETING_PREFIX_OFFSET_MS),
            technicalBridgeAccountId: (yield* testSeedService.bankSyncAccount(
                'Supersession Competing UAH',
                null,
                COMPETING_TECHNICAL_BRIDGE_IBAN
            )).id,
            transferMccId: topology.transferMccId
        });
    }

    yield* runConsolidation();
    const prefixCanonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
    const [prefixCanonical] = prefixCanonicals;
    const { completeExpense, completeIncome, existingTransfer } = yield* seedIbanBridgeSupersessionCompleteRoute({
        bridgeAccountId: topology.bridgeAccount.id,
        bridgeIban: topology.bridgeAccount.iban,
        completeSourceAmount,
        sourceAccountId: topology.sourceAccount.id,
        targetAccountId: topology.targetAccount.id,
        transferMccId: topology.transferMccId
    });
    const result = yield* runConsolidation(
        scopeArrivalToSyncedTransactions
            ? consolidationScopeService.buildFromTransactions([completeExpense, completeIncome, existingTransfer])
            : null
    );
    const liveCanonicals = (yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).filter(
        canonical => !isDefined(canonical.consolidationParentTransactionId)
    );
    const canonical = liveCanonicals.find(candidate => candidate.toAccountId === topology.targetAccount.id);

    if (!isDefined(canonical)) {
        throw new Error('Complete bridge canonical was not created');
    }

    return {
        ...topology,
        canonical,
        completeIncome,
        completeSourceTransactionIds: [completeExpense.id, completeIncome.id, existingTransfer.id],
        liveCanonicals,
        prefixCanonical,
        prefixCanonicals,
        prefixSourceTransactionIds,
        result
    };
});

const expectCompleteSupersession = Effect.fnUntraced(function* ({
    bridgeAccountId,
    canonicalId,
    completeIncomeId,
    prefixCanonicalId,
    sourceAccountId,
    targetAccountId
}: {
    readonly bridgeAccountId: number;
    readonly canonicalId: number;
    readonly completeIncomeId: number;
    readonly prefixCanonicalId: number;
    readonly sourceAccountId: number;
    readonly targetAccountId: number;
}) {
    expect((yield* testQueryService.fetchTransactionById(completeIncomeId)).consolidationParentTransactionId).toBe(canonicalId);
    yield* expectConsolidationParent(prefixCanonicalId, canonicalId);
    expect(yield* fetchOwnLedgerEntries(prefixCanonicalId)).toHaveLength(0);
    expect((yield* fetchLedgerEntry(canonicalId, sourceAccountId)).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
    expect((yield* fetchLedgerEntry(canonicalId, targetAccountId)).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
    expect((yield* fetchOwnLedgerEntries(canonicalId)).some(entry => entry.accountId === bridgeAccountId)).toBe(false);
});

layer(TestLayer)('consolidation/iban-bridge-canonical-supersession', it => {
    it.effect('supersedes a partial source-to-bridge canonical when the complete route arrives later', () =>
        Effect.gen(function* () {
            const { bridgeAccount, canonical, completeIncome, liveCanonicals, prefixCanonical, result, sourceAccount, targetAccount } =
                yield* seedIncrementalBridgeArrival();

            expect(result.consolidated).toBe(2);
            expect(liveCanonicals).toHaveLength(1);
            expect(canonical.fromAccountId).toBe(sourceAccount.id);
            expect(canonical.toAccountId).toBe(targetAccount.id);
            yield* expectCompleteSupersession({
                bridgeAccountId: bridgeAccount.id,
                canonicalId: canonical.id,
                completeIncomeId: completeIncome.id,
                prefixCanonicalId: prefixCanonical.id,
                sourceAccountId: sourceAccount.id,
                targetAccountId: targetAccount.id
            });

            const repeatedResult = yield* runConsolidation();

            expect(repeatedResult.found).toBe(0);
            expect(repeatedResult.consolidated).toBe(0);
        })
    );

    it.effect('supersedes the stale prefix inside the sync scope that delivered the completing bridge income', () =>
        Effect.gen(function* () {
            const { canonical, liveCanonicals, prefixCanonical } = yield* seedIncrementalBridgeArrival({
                scopeArrivalToSyncedTransactions: true
            });

            expect(liveCanonicals).toHaveLength(1);
            yield* expectConsolidationParent(prefixCanonical.id, canonical.id);
        })
    );

    it.effect('keeps a distinct same-source transfer with a different amount active', () =>
        Effect.gen(function* () {
            const { liveCanonicals, prefixCanonical, result } = yield* seedIncrementalBridgeArrival({
                completeSourceAmount: DISTINCT_SOURCE_AMOUNT
            });

            expect(result.consolidated).toBe(1);
            expect(liveCanonicals).toHaveLength(2);
            expect((yield* testQueryService.fetchTransactionById(prefixCanonical.id)).consolidationParentTransactionId).toBeNull();
        })
    );
});

layer(TestLayer)('consolidation/iban-bridge-canonical-supersession calibration', it => {
    it.effect('keeps a calibrated historical prefix canonical active', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeIncome, canonical, sourceAccount, supersededCanonical, targetAccount } =
                yield* seedManualSupersessionCandidate();
            const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];

            yield* stampIbanBridgeTransactions([supersededCanonical.id, canonical.id, bridgeIncome.id], HISTORICAL_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(sourceAccount.id, CALIBRATION_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(bridgeAccount.id, CALIBRATION_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(targetAccount.id, CALIBRATION_CREATED_AT);

            const balancesBeforeConsolidation = yield* fetchLedgerBalances(accountIds);
            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            expect((yield* testQueryService.fetchTransactionById(supersededCanonical.id)).consolidationParentTransactionId).toBeNull();
            expect(yield* fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
        })
    );

    it.effect('allows a post-calibration prefix canonical to supersede an older keeper canonical', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeIncome, canonical, sourceAccount, supersededCanonical, targetAccount } =
                yield* seedManualSupersessionCandidate();

            yield* stampIbanBridgeTransactions([canonical.id, bridgeIncome.id], HISTORICAL_CREATED_AT);
            yield* stampIbanBridgeTransactions([supersededCanonical.id], POST_CALIBRATION_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(sourceAccount.id, CALIBRATION_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(bridgeAccount.id, CALIBRATION_CREATED_AT);
            yield* seedIbanBridgeBalanceAdjustment(targetAccount.id, CALIBRATION_CREATED_AT);

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(1);
            yield* expectConsolidationParent(supersededCanonical.id, canonical.id);
        })
    );

    it.effect('keeps two same-amount source-to-bridge canonicals live instead of cross-matching one of them', () =>
        Effect.gen(function* () {
            const { liveCanonicals, prefixCanonicals } = yield* seedIncrementalBridgeArrival({ withCompetingPrefix: true });

            expect(prefixCanonicals).toHaveLength(2);
            expect(liveCanonicals).toHaveLength(3);
            for (const competingCanonical of prefixCanonicals) {
                expect((yield* testQueryService.fetchTransactionById(competingCanonical.id)).consolidationParentTransactionId).toBeNull();
            }
        })
    );

    it.effect('restores the nested prefix and both source groups through sequential reverts', () =>
        Effect.gen(function* () {
            const { canonical, completeSourceTransactionIds, prefixCanonical, prefixSourceTransactionIds } =
                yield* seedIncrementalBridgeArrival();

            yield* unconsolidateById(canonical.id);

            expect((yield* testQueryService.fetchTransactionById(prefixCanonical.id)).consolidationParentTransactionId).toBeNull();
            expect(yield* fetchOwnLedgerEntries(prefixCanonical.id)).toHaveLength(2);
            yield* expectSourcesRestored(completeSourceTransactionIds);
            for (const sourceTransactionId of prefixSourceTransactionIds) {
                yield* expectConsolidationParent(sourceTransactionId, prefixCanonical.id);
            }

            yield* unconsolidateById(prefixCanonical.id);

            yield* expectSourcesRestored(prefixSourceTransactionIds);
        })
    );
});
