import { consolidationScopeService } from '@budgie/consolidation';
import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import { isDefined } from '@rnw-community/shared';

import {
    expectConsolidationParent,
    expectSourcesRestored,
    fetchLedgerEntry,
    fetchOwnLedgerEntries
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_OPERATED_AT,
    IBAN_BRIDGE_SOURCE_IBAN,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_UAH_TO_EUR_RATE,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, unconsolidateById, TestLayer } from '../harness/test-context';

import type { AccountEntityInterface } from '@budgie/contracts';

const TECHNICAL_BRIDGE_IBAN = 'UA-SUPERSESSION-TECHNICAL-UAH';
const COMPETING_TECHNICAL_BRIDGE_IBAN = 'UA-SUPERSESSION-COMPETING-UAH';
const DISTINCT_SOURCE_AMOUNT = IBAN_BRIDGE_EUR_AMOUNT + 10_000_000;
const COMPETING_PREFIX_OFFSET_MS = 30_000;

const seedPrefixArrival = (
    technicalBridgeAccount: AccountEntityInterface,
    bridgeIban: string | null,
    transferMccId: number,
    externalIdPrefix: string,
    operatedAt: Date
) =>
    Effect.gen(function* () {
        const prefixIncome = yield* testSeedService.bankPairIncome(
            { externalId: `${externalIdPrefix}-income`, operatedAt },
            {
                accountId: technicalBridgeAccount.id,
                amount: IBAN_BRIDGE_UAH_AMOUNT,
                exchangeRate: IBAN_BRIDGE_UAH_AMOUNT / IBAN_BRIDGE_EUR_AMOUNT,
                mccCategoryId: transferMccId,
                toIban: IBAN_BRIDGE_SOURCE_IBAN
            }
        );
        const prefixExpense = yield* testSeedService.bankPairExpense(
            { externalId: `${externalIdPrefix}-expense`, operatedAt },
            {
                accountId: technicalBridgeAccount.id,
                amount: IBAN_BRIDGE_UAH_AMOUNT,
                mccCategoryId: transferMccId,
                toIban: bridgeIban
            }
        );

        return [prefixIncome.id, prefixExpense.id];
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

    const prefixSourceTransactionIds = yield* seedPrefixArrival(
        technicalBridgeAccount,
        topology.bridgeAccount.iban,
        topology.transferMccId,
        'supersession-prefix',
        IBAN_BRIDGE_OPERATED_AT
    );

    if (withCompetingPrefix) {
        yield* seedPrefixArrival(
            yield* testSeedService.bankSyncAccount('Supersession Competing UAH', null, COMPETING_TECHNICAL_BRIDGE_IBAN),
            topology.bridgeAccount.iban,
            topology.transferMccId,
            'supersession-competing-prefix',
            new Date(IBAN_BRIDGE_OPERATED_AT.getTime() + COMPETING_PREFIX_OFFSET_MS)
        );
    }

    yield* runConsolidation();
    const prefixCanonicals = yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
    const [prefixCanonical] = prefixCanonicals;
    const completeExpense = yield* testSeedService.bankPairExpense(
        { externalId: 'supersession-complete-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: topology.sourceAccount.id,
            amount: completeSourceAmount,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: topology.transferMccId,
            toIban: topology.bridgeAccount.iban
        }
    );
    const completeIncome = yield* testSeedService.bankPairIncome(
        { externalId: 'supersession-complete-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: topology.bridgeAccount.id,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: topology.transferMccId,
            toIban: IBAN_BRIDGE_SOURCE_IBAN
        }
    );
    const existingTransfer = yield* testSeedService.directTransfer({
        targetAccountId: topology.targetAccount.id,
        sourceAccountId: topology.bridgeAccount.id,
        operatedAt: IBAN_BRIDGE_OPERATED_AT,
        targetAmount: IBAN_BRIDGE_UAH_AMOUNT,
        sourceAmount: IBAN_BRIDGE_UAH_AMOUNT,
        toIban: IBAN_BRIDGE_TARGET_IBAN,
        consolidationType: null,
        sourceEntryExchangeRate: 1,
        exchangeRate: 1
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

layer(TestLayer)('consolidation/iban-bridge-canonical-supersession', it => {
    it.effect('supersedes a partial source-to-bridge canonical when the complete route arrives later', () =>
        Effect.gen(function* () {
            const { bridgeAccount, canonical, completeIncome, liveCanonicals, prefixCanonical, result, sourceAccount, targetAccount } =
                yield* seedIncrementalBridgeArrival();

            expect(result.consolidated).toBe(2);
            expect(liveCanonicals).toHaveLength(1);
            expect(canonical.fromAccountId).toBe(sourceAccount.id);
            expect(canonical.toAccountId).toBe(targetAccount.id);
            expect((yield* testQueryService.fetchTransactionById(completeIncome.id)).consolidationParentTransactionId).toBe(canonical.id);
            yield* expectConsolidationParent(prefixCanonical.id, canonical.id);
            expect(yield* fetchOwnLedgerEntries(prefixCanonical.id)).toHaveLength(0);
            expect((yield* fetchLedgerEntry(canonical.id, sourceAccount.id)).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
            expect((yield* fetchLedgerEntry(canonical.id, targetAccount.id)).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
            expect((yield* fetchOwnLedgerEntries(canonical.id)).some(entry => entry.accountId === bridgeAccount.id)).toBe(false);

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
