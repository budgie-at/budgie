import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
    seedChainReclaimFixture,
    seedNestedChainReclaimFixture
} from '../harness/chain-reclaim-fixture';
import {
    expectConsolidationParent,
    expectSourcesRestored,
    fetchLedgerBalances,
    fetchLedgerEntry,
    fetchOwnLedgerEntries,
    fetchSingleCanonicalId
} from '../harness/consolidation-revert-audit';
import {
    IBAN_BRIDGE_EUR_AMOUNT,
    IBAN_BRIDGE_SOURCE_IBAN,
    IBAN_BRIDGE_TARGET_IBAN,
    IBAN_BRIDGE_UAH_AMOUNT,
    IBAN_BRIDGE_UAH_TO_EUR_RATE
} from '../harness/iban-bridge-topology';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, unconsolidationService } from '../harness/test-context';

const RATE_PRECISION_DIGITS = 10;
const REBUILT_LEDGER_ENTRY_COUNT = 2;
const STALE_DIRECT_TRANSFER = {
    directExchangeRate: IBAN_BRIDGE_UAH_TO_EUR_RATE * CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
    directToIban: IBAN_BRIDGE_SOURCE_IBAN
};

const fetchRebuiltCanonicalId = (): number => fetchSingleCanonicalId(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

const expectRebuiltCanonicalLedger = (canonicalId: number, sourceAccountId: number, targetAccountId: number): void => {
    const sourceLedgerEntry = fetchLedgerEntry(canonicalId, sourceAccountId);

    expect(testQueryService.fetchTransactionById(canonicalId).exchangeRate).toBeCloseTo(IBAN_BRIDGE_UAH_TO_EUR_RATE, RATE_PRECISION_DIGITS);
    expect(sourceLedgerEntry.amount).toBe(IBAN_BRIDGE_EUR_AMOUNT);
    expect(sourceLedgerEntry.toIban).toBe(IBAN_BRIDGE_TARGET_IBAN);
    expect(sourceLedgerEntry.exchangeRate).toBeCloseTo(IBAN_BRIDGE_UAH_TO_EUR_RATE, RATE_PRECISION_DIGITS);
    expect(fetchLedgerEntry(canonicalId, targetAccountId).amount).toBe(IBAN_BRIDGE_UAH_AMOUNT);
};

describe('consolidation/iban-bridge-chain-reclaim-rebuild', () => {
    it('rebuilds an fx-correct canonical when the existing transfer ledger diverges', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount } = seedChainReclaimFixture({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            ...STALE_DIRECT_TRANSFER
        });

        const result = await runConsolidation();
        const rebuiltCanonicalId = fetchRebuiltCanonicalId();

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expect(rebuiltCanonicalId).not.toBe(directTransfer.id);
        expectConsolidationParent(directTransfer.id, rebuiltCanonicalId);
        expectConsolidationParent(bridgeIncome.id, rebuiltCanonicalId);
        expectConsolidationParent(bridgeExpense.id, rebuiltCanonicalId);
        expectRebuiltCanonicalLedger(rebuiltCanonicalId, sourceAccount.id, targetAccount.id);
    });

    it('restores the original transfer pair when a rebuilt chain canonical is reverted', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            ...STALE_DIRECT_TRANSFER
        });

        await runConsolidation();
        await unconsolidationService.unconsolidateById(fetchRebuiltCanonicalId(), testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(0);
        expect(testQueryService.fetchTransactionById(directTransfer.id).consolidationType).toBe(
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );
        expectSourcesRestored([directTransfer.id, bridgeIncome.id, bridgeExpense.id]);
        expect(fetchOwnLedgerEntries(directTransfer.id)).toHaveLength(REBUILT_LEDGER_ENTRY_COUNT);
    });

    it('unwinds both consolidation levels and deletes the absorbed transfer pair when a fast-path reclaim is reverted', async () => {
        const { bridgeAccount, bridgeExpense, bridgeIncome, directTransfer, sourceAccount, sourceExpense, targetAccount, targetIncome } =
            await seedNestedChainReclaimFixture();
        const accountIds = [sourceAccount.id, bridgeAccount.id, targetAccount.id];
        const balancesBeforeConsolidation = await fetchLedgerBalances(accountIds);

        await runConsolidation();
        await unconsolidationService.unconsolidateById(directTransfer.id, testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(0);
        expect(testQueryService.findTransactionById(directTransfer.id)).toBeUndefined();
        expectSourcesRestored([sourceExpense.id, targetIncome.id, bridgeIncome.id, bridgeExpense.id]);
        expect(fetchOwnLedgerEntries(sourceExpense.id)).toHaveLength(1);
        expect(await fetchLedgerBalances(accountIds)).toEqual(balancesBeforeConsolidation);
    });
});
