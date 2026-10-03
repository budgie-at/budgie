import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { expect, layer } from '@effect/vitest';
import * as Effect from 'effect/Effect';

import {
    expectConsolidationParent,
    expectRevertRestoresSources,
    fetchLedgerEntry,
    fetchMovedSourceIds,
    fetchSingleCanonicalId,
    revertSingleCanonical
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_SOURCE_IBAN,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_OPERATED_AT,
    seedIbanBridgeLegs,
    seedIbanBridgeTopology
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService, TestLayer } from '../harness/test-context';

const byTransactionId = (left: number, right: number): number => left - right;

const DIRECT_CENT_OFF_EUR_AMOUNT = 500_000;
const BRIDGE_IMPLIED_EUR_AMOUNT = 510_000;
const CENT_OFF_PAIR_UAH_AMOUNT = 25_500_000;
const CENT_OFF_UAH_TO_EUR_RATE = CENT_OFF_PAIR_UAH_AMOUNT / BRIDGE_IMPLIED_EUR_AMOUNT;

const seedIbanBridgeTransferFixture = () =>
    Effect.gen(function* () {
        const topology = yield* seedIbanBridgeTopology();

        return { ...topology, ...(yield* seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId)) };
    });

// eslint-disable-next-line max-lines-per-function -- Test suite with multiple fixture-heavy scenarios
layer(TestLayer)('consolidation/iban-bridge-transfer', it => {
    it.effect('builds a source to target canonical from two bridge legs', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome, sourceAccount, targetAccount } = yield* seedIbanBridgeTransferFixture();

            const result = yield* runConsolidation();
            const canonicalId = yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);

            expect(result.consolidated).toBe(1);
            yield* expectConsolidationParent(bridgeIncome.id, canonicalId);
            yield* expectConsolidationParent(bridgeExpense.id, canonicalId);
            expect(yield* fetchMovedSourceIds(canonicalId)).toEqual([bridgeIncome.id, bridgeExpense.id].sort(byTransactionId));
            expect((yield* fetchLedgerEntry(canonicalId, sourceAccount.id)).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
            expect((yield* fetchLedgerEntry(canonicalId, sourceAccount.id)).toIban).toBe(IBAN_BRIDGE_TARGET_IBAN);
            expect((yield* fetchLedgerEntry(canonicalId, targetAccount.id)).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
        })
    );

    it.effect('restores both bridge legs and account balances when the bridge canonical is reverted', () =>
        Effect.gen(function* () {
            const { bridgeAccount, bridgeExpense, bridgeIncome, sourceAccount, targetAccount } = yield* seedIbanBridgeTransferFixture();

            yield* expectRevertRestoresSources({
                accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
                consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
                sourceTransactionIds: [bridgeIncome.id, bridgeExpense.id]
            });
        })
    );

    it.effect('rebuilds the same bridge canonical shape after a revert', () =>
        Effect.gen(function* () {
            const { bridgeExpense, bridgeIncome } = yield* seedIbanBridgeTransferFixture();

            yield* runConsolidation();
            yield* revertSingleCanonical(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
            const repeatedResult = yield* runConsolidation();

            expect(repeatedResult.consolidated).toBe(1);
            expect(
                yield* fetchMovedSourceIds(yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER))
            ).toEqual([bridgeIncome.id, bridgeExpense.id].sort(byTransactionId));
        })
    );

    it.effect('stands down when a same-pair canonical already records the same physical transfer within a cent', () =>
        Effect.gen(function* () {
            const { bridgeAccount, sourceAccount, targetAccount, transferMccId } = yield* seedIbanBridgeTopology();
            const directCanonical = yield* testSeedService.directTransfer({
                consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
                exchangeRate: CENT_OFF_PAIR_UAH_AMOUNT / DIRECT_CENT_OFF_EUR_AMOUNT,
                operatedAt: IBAN_BRIDGE_OPERATED_AT,
                sourceAccountId: sourceAccount.id,
                sourceAmount: DIRECT_CENT_OFF_EUR_AMOUNT,
                sourceEntryExchangeRate: CENT_OFF_PAIR_UAH_AMOUNT / DIRECT_CENT_OFF_EUR_AMOUNT,
                targetAccountId: targetAccount.id,
                targetAmount: CENT_OFF_PAIR_UAH_AMOUNT,
                toIban: IBAN_BRIDGE_TARGET_IBAN
            });
            const bridgeExpense = yield* testSeedService.bankPairExpense(
                { externalId: 'cent-off-bridge-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
                {
                    accountId: bridgeAccount.id,
                    amount: CENT_OFF_PAIR_UAH_AMOUNT,
                    mccCategoryId: transferMccId,
                    toIban: IBAN_BRIDGE_TARGET_IBAN
                }
            );
            const bridgeIncome = yield* testSeedService.bankPairIncome(
                { externalId: 'cent-off-bridge-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
                {
                    accountId: bridgeAccount.id,
                    amount: CENT_OFF_PAIR_UAH_AMOUNT,
                    exchangeRate: CENT_OFF_UAH_TO_EUR_RATE,
                    mccCategoryId: transferMccId,
                    toIban: IBAN_BRIDGE_SOURCE_IBAN
                }
            );

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(0);
            expect(yield* fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toBe(directCanonical.id);
            expect((yield* testQueryService.fetchTransactionById(bridgeExpense.id)).consolidationParentTransactionId).toBeNull();
            expect((yield* testQueryService.fetchTransactionById(bridgeIncome.id)).consolidationParentTransactionId).toBeNull();
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).toHaveLength(0);
        })
    );

    it.effect('still consolidates distinct same-minute transfers with different amounts into separate canonicals', () =>
        Effect.gen(function* () {
            const doubledUahAmount = 2 * IBAN_BRIDGE_UAH_AMOUNT;
            const { bridgeAccount, transferMccId } = yield* seedIbanBridgeTransferFixture();
            const secondOperatedAt = new Date(IBAN_BRIDGE_OPERATED_AT.getTime() + 30_000);
            yield* testSeedService.bankPairExpense(
                { externalId: 'distinct-second-expense', operatedAt: secondOperatedAt },
                {
                    accountId: bridgeAccount.id,
                    amount: doubledUahAmount,
                    mccCategoryId: transferMccId,
                    toIban: IBAN_BRIDGE_TARGET_IBAN
                }
            );
            yield* testSeedService.bankPairIncome(
                { externalId: 'distinct-second-income', operatedAt: secondOperatedAt },
                {
                    accountId: bridgeAccount.id,
                    amount: doubledUahAmount,
                    exchangeRate: doubledUahAmount / (2 * IBAN_BRIDGE_EUR_AMOUNT),
                    mccCategoryId: transferMccId,
                    toIban: IBAN_BRIDGE_SOURCE_IBAN
                }
            );

            const result = yield* runConsolidation();

            expect(result.consolidated).toBe(2);
            expect(yield* testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).toHaveLength(2);
        })
    );
});
