import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

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
import { testDb, testQueryService, testSeedService, unconsolidationService } from '../harness/test-context';

const TECHNICAL_BRIDGE_IBAN = 'UA-SUPERSESSION-TECHNICAL-UAH';
const DISTINCT_SOURCE_AMOUNT = IBAN_BRIDGE_EUR_AMOUNT + 10_000_000;

const seedIncrementalBridgeArrival = async (completeSourceAmount: number = IBAN_BRIDGE_EUR_AMOUNT) => {
    const topology = seedIbanBridgeTopology();
    const technicalBridgeAccount = testSeedService.bankSyncAccount('Supersession Technical UAH', null, TECHNICAL_BRIDGE_IBAN);
    const prefixIncome = testSeedService.bankPairIncome(
        { externalId: 'supersession-prefix-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: technicalBridgeAccount.id,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_UAH_AMOUNT / IBAN_BRIDGE_EUR_AMOUNT,
            mccCategoryId: topology.transferMccId,
            toIban: IBAN_BRIDGE_SOURCE_IBAN
        }
    );
    const prefixExpense = testSeedService.bankPairExpense(
        { externalId: 'supersession-prefix-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: technicalBridgeAccount.id,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            mccCategoryId: topology.transferMccId,
            toIban: topology.bridgeAccount.iban
        }
    );

    await runConsolidation();
    const [prefixCanonical] = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER);
    const completeExpense = testSeedService.bankPairExpense(
        { externalId: 'supersession-complete-expense', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: topology.sourceAccount.id,
            amount: completeSourceAmount,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: topology.transferMccId,
            toIban: topology.bridgeAccount.iban
        }
    );
    const completeIncome = testSeedService.bankPairIncome(
        { externalId: 'supersession-complete-income', operatedAt: IBAN_BRIDGE_OPERATED_AT },
        {
            accountId: topology.bridgeAccount.id,
            amount: IBAN_BRIDGE_UAH_AMOUNT,
            exchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE,
            mccCategoryId: topology.transferMccId,
            toIban: IBAN_BRIDGE_SOURCE_IBAN
        }
    );
    const existingTransfer = testSeedService.directTransfer({
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
    const result = await runConsolidation();
    const liveCanonicals = testQueryService
        .fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_TRANSFER)
        .filter(canonical => !isDefined(canonical.consolidationParentTransactionId));
    const canonical = liveCanonicals.find(candidate => candidate.toAccountId === topology.targetAccount.id);

    if (!isDefined(canonical)) {
        throw new Error('Complete bridge canonical was not created');
    }

    return {
        ...topology,
        canonical,
        completeSourceTransactionIds: [completeExpense.id, completeIncome.id, existingTransfer.id],
        liveCanonicals,
        prefixCanonical,
        prefixSourceTransactionIds: [prefixIncome.id, prefixExpense.id],
        result
    };
};

describe('consolidation/iban-bridge-canonical-supersession', () => {
    it('supersedes a partial source-to-bridge canonical when the complete route arrives later', async () => {
        const { bridgeAccount, canonical, liveCanonicals, prefixCanonical, result, sourceAccount, targetAccount } =
            await seedIncrementalBridgeArrival();

        expect(result.consolidated).toBe(2);
        expect(liveCanonicals).toHaveLength(1);
        expect(canonical.fromAccountId).toBe(sourceAccount.id);
        expect(canonical.toAccountId).toBe(targetAccount.id);
        expectConsolidationParent(prefixCanonical.id, canonical.id);
        expect(fetchOwnLedgerEntries(prefixCanonical.id)).toHaveLength(0);
        expect(fetchLedgerEntry(canonical.id, sourceAccount.id).amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
        expect(fetchLedgerEntry(canonical.id, targetAccount.id).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
        expect(fetchOwnLedgerEntries(canonical.id).some(entry => entry.accountId === bridgeAccount.id)).toBe(false);

        const repeatedResult = await runConsolidation();

        expect(repeatedResult.found).toBe(0);
        expect(repeatedResult.consolidated).toBe(0);
    });

    it('keeps a distinct same-source transfer with a different amount active', async () => {
        const { liveCanonicals, prefixCanonical, result } = await seedIncrementalBridgeArrival(DISTINCT_SOURCE_AMOUNT);

        expect(result.consolidated).toBe(1);
        expect(liveCanonicals).toHaveLength(2);
        expect(testQueryService.fetchTransactionById(prefixCanonical.id).consolidationParentTransactionId).toBeNull();
    });

    it('restores the nested prefix and both source groups through sequential reverts', async () => {
        const { canonical, completeSourceTransactionIds, prefixCanonical, prefixSourceTransactionIds } =
            await seedIncrementalBridgeArrival();

        await unconsolidationService.unconsolidateById(canonical.id, testDb);

        expect(testQueryService.fetchTransactionById(prefixCanonical.id).consolidationParentTransactionId).toBeNull();
        expect(fetchOwnLedgerEntries(prefixCanonical.id)).toHaveLength(2);
        expectSourcesRestored(completeSourceTransactionIds);
        prefixSourceTransactionIds.forEach(sourceTransactionId => expectConsolidationParent(sourceTransactionId, prefixCanonical.id));

        await unconsolidationService.unconsolidateById(prefixCanonical.id, testDb);

        expectSourcesRestored(prefixSourceTransactionIds);
    });
});
