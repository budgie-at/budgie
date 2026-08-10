import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    CHAIN_RECLAIM_EUR_AMOUNT,
    CHAIN_RECLAIM_SOURCE_IBAN,
    CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
    CHAIN_RECLAIM_TARGET_IBAN,
    CHAIN_RECLAIM_UAH_AMOUNT,
    CHAIN_RECLAIM_UAH_TO_EUR_RATE,
    expectChainReclaimParent,
    expectChainReclaimUnparented,
    fetchChainReclaimLedgerEntry,
    fetchChainReclaimOwnLedger,
    seedChainReclaimFixture,
    seedNestedChainReclaimFixture
} from '../harness/chain-reclaim-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, unconsolidationService } from '../harness/test-context';

const RATE_PRECISION_DIGITS = 10;
const REBUILT_LEDGER_ENTRY_COUNT = 2;

const fetchRebuiltCanonicalId = (): number => {
    const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);

    expect(canonicals).toHaveLength(1);

    return canonicals[0].id;
};

const expectRebuiltCanonicalLedger = (canonicalId: number, sourceAccountId: number, targetAccountId: number): void => {
    const sourceLedgerEntry = fetchChainReclaimLedgerEntry(canonicalId, sourceAccountId);

    expect(testQueryService.fetchTransactionById(canonicalId).exchangeRate).toBeCloseTo(
        CHAIN_RECLAIM_UAH_TO_EUR_RATE,
        RATE_PRECISION_DIGITS
    );
    expect(sourceLedgerEntry.amount).toBe(CHAIN_RECLAIM_EUR_AMOUNT);
    expect(sourceLedgerEntry.toIban).toBe(CHAIN_RECLAIM_TARGET_IBAN);
    expect(sourceLedgerEntry.exchangeRate).toBeCloseTo(CHAIN_RECLAIM_UAH_TO_EUR_RATE, RATE_PRECISION_DIGITS);
    expect(fetchChainReclaimLedgerEntry(canonicalId, targetAccountId).amount).toBe(CHAIN_RECLAIM_UAH_AMOUNT);
};

describe('consolidation/iban-bridge-chain-reclaim-rebuild', () => {
    it('rebuilds an fx-correct canonical when the existing transfer ledger diverges', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, sourceAccount, targetAccount } = seedChainReclaimFixture({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            directExchangeRate: CHAIN_RECLAIM_UAH_TO_EUR_RATE * CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
            directToIban: CHAIN_RECLAIM_SOURCE_IBAN
        });

        const result = await runConsolidation();
        const rebuiltCanonicalId = fetchRebuiltCanonicalId();

        expect(result.found).toBe(1);
        expect(result.consolidated).toBe(1);
        expect(rebuiltCanonicalId).not.toBe(directTransfer.id);
        expectChainReclaimParent(directTransfer.id, rebuiltCanonicalId);
        expectChainReclaimParent(bridgeIncome.id, rebuiltCanonicalId);
        expectChainReclaimParent(bridgeExpense.id, rebuiltCanonicalId);
        expectRebuiltCanonicalLedger(rebuiltCanonicalId, sourceAccount.id, targetAccount.id);
    });

    it('restores the original transfer pair when a rebuilt chain canonical is reverted', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer } = seedChainReclaimFixture({
            consolidationType: TransactionConsolidationTypeEnum.TRANSFER_PAIR,
            directExchangeRate: CHAIN_RECLAIM_UAH_TO_EUR_RATE * CHAIN_RECLAIM_STALE_RATE_MULTIPLIER,
            directToIban: CHAIN_RECLAIM_SOURCE_IBAN
        });

        await runConsolidation();
        await unconsolidationService.unconsolidateById(fetchRebuiltCanonicalId(), testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(0);
        expect(testQueryService.fetchTransactionById(directTransfer.id).consolidationType).toBe(
            TransactionConsolidationTypeEnum.TRANSFER_PAIR
        );
        expectChainReclaimUnparented([directTransfer.id, bridgeIncome.id, bridgeExpense.id]);
        expect(fetchChainReclaimOwnLedger(directTransfer.id)).toHaveLength(REBUILT_LEDGER_ENTRY_COUNT);
    });

    it('restores every chain leg when a fast-path reclaim is reverted', async () => {
        const { bridgeExpense, bridgeIncome, directTransfer, sourceExpense, targetIncome } = await seedNestedChainReclaimFixture();

        await runConsolidation();
        await unconsolidationService.unconsolidateById(directTransfer.id, testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(0);
        expectChainReclaimUnparented([sourceExpense.id, targetIncome.id, bridgeIncome.id, bridgeExpense.id]);
        expect(fetchChainReclaimOwnLedger(sourceExpense.id)).toHaveLength(1);
        expect(fetchChainReclaimOwnLedger(targetIncome.id)).toHaveLength(1);
        expect(fetchChainReclaimOwnLedger(bridgeIncome.id)).toHaveLength(1);
        expect(fetchChainReclaimOwnLedger(bridgeExpense.id)).toHaveLength(1);
    });
});
