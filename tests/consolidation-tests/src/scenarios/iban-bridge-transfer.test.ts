import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

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
import { testQueryService, testSeedService } from '../harness/test-context';

const byTransactionId = (left: number, right: number): number => left - right;

const DIRECT_CENT_OFF_EUR_AMOUNT = 500_000;
const BRIDGE_IMPLIED_EUR_AMOUNT = 510_000;
const CENT_OFF_PAIR_UAH_AMOUNT = 25_500_000;
const CENT_OFF_UAH_TO_EUR_RATE = CENT_OFF_PAIR_UAH_AMOUNT / BRIDGE_IMPLIED_EUR_AMOUNT;

const seedIbanBridgeTransferFixture = () => {
    const topology = seedIbanBridgeTopology();

    return { ...topology, ...seedIbanBridgeLegs(topology.bridgeAccount.id, topology.transferMccId) };
};

// eslint-disable-next-line max-lines-per-function -- Test suite with multiple fixture-heavy scenarios
describe('consolidation/iban-bridge-transfer', () => {
    it('builds a source to target canonical from two bridge legs', async () => {
        const { bridgeExpense, bridgeIncome, sourceAccount, targetAccount } = seedIbanBridgeTransferFixture();

        const result = await runConsolidation();
        const canonicalId = fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);

        expect(result.consolidated).toBe(1);
        expectConsolidationParent(bridgeIncome.id, canonicalId);
        expectConsolidationParent(bridgeExpense.id, canonicalId);
        expect(fetchMovedSourceIds(canonicalId)).toEqual([bridgeIncome.id, bridgeExpense.id].sort(byTransactionId));
        expect(fetchLedgerEntry(canonicalId, sourceAccount.id).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
        expect(fetchLedgerEntry(canonicalId, sourceAccount.id).toIban).toBe(IBAN_BRIDGE_TARGET_IBAN);
        expect(fetchLedgerEntry(canonicalId, targetAccount.id).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
    });

    it('restores both bridge legs and account balances when the bridge canonical is reverted', async () => {
        const { bridgeAccount, bridgeExpense, bridgeIncome, sourceAccount, targetAccount } = seedIbanBridgeTransferFixture();

        await expectRevertRestoresSources({
            accountIds: [sourceAccount.id, bridgeAccount.id, targetAccount.id],
            consolidationType: TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER,
            sourceTransactionIds: [bridgeIncome.id, bridgeExpense.id]
        });
    });

    it('rebuilds the same bridge canonical shape after a revert', async () => {
        const { bridgeExpense, bridgeIncome } = seedIbanBridgeTransferFixture();

        await runConsolidation();
        await revertSingleCanonical(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
        const repeatedResult = await runConsolidation();

        expect(repeatedResult.consolidated).toBe(1);
        expect(fetchMovedSourceIds(fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER))).toEqual(
            [bridgeIncome.id, bridgeExpense.id].sort(byTransactionId)
        );
    });

    it('stands down when a same-pair canonical already records the same physical transfer within a cent', async () => {
        const { bridgeAccount, sourceAccount, targetAccount, transferMccId } = seedIbanBridgeTopology();
        const directCanonical = testSeedService.directTransfer({
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
        const bridgeExpense = testSeedService.bankPairExpense(
            { externalId: 'cent-off-bridge-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
            {
                accountId: bridgeAccount.id,
                amount: CENT_OFF_PAIR_UAH_AMOUNT,
                mccCategoryId: transferMccId,
                toIban: IBAN_BRIDGE_TARGET_IBAN
            }
        );
        const bridgeIncome = testSeedService.bankPairIncome(
            { externalId: 'cent-off-bridge-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
            {
                accountId: bridgeAccount.id,
                amount: CENT_OFF_PAIR_UAH_AMOUNT,
                exchangeRate: CENT_OFF_UAH_TO_EUR_RATE,
                mccCategoryId: transferMccId,
                toIban: IBAN_BRIDGE_SOURCE_IBAN
            }
        );

        const result = await runConsolidation();

        expect(result.consolidated).toBe(0);
        expect(fetchSingleCanonicalId(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toBe(directCanonical.id);
        expect(testQueryService.fetchTransactionById(bridgeExpense.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).toHaveLength(0);
    });

    it('still consolidates distinct same-minute transfers with different amounts into separate canonicals', async () => {
        const doubledUahAmount = 2 * IBAN_BRIDGE_UAH_AMOUNT;
        const { bridgeAccount, transferMccId } = seedIbanBridgeTransferFixture();
        const secondOperatedAt = new Date(IBAN_BRIDGE_OPERATED_AT.getTime() + 30_000);
        testSeedService.bankPairExpense(
            { externalId: 'distinct-second-expense', operatedAt: secondOperatedAt },
            {
                accountId: bridgeAccount.id,
                amount: doubledUahAmount,
                mccCategoryId: transferMccId,
                toIban: IBAN_BRIDGE_TARGET_IBAN
            }
        );
        testSeedService.bankPairIncome(
            { externalId: 'distinct-second-income', operatedAt: secondOperatedAt },
            {
                accountId: bridgeAccount.id,
                amount: doubledUahAmount,
                exchangeRate: doubledUahAmount / (2 * IBAN_BRIDGE_EUR_AMOUNT),
                mccCategoryId: transferMccId,
                toIban: IBAN_BRIDGE_SOURCE_IBAN
            }
        );

        const result = await runConsolidation();

        expect(result.consolidated).toBe(2);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)).toHaveLength(2);
    });
});
