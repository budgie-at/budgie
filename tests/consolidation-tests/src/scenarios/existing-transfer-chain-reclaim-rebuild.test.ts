import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    CHAIN_RECLAIM_EXCHANGE_RATE,
    CHAIN_RECLAIM_SOURCE_AMOUNT,
    CHAIN_RECLAIM_TARGET_AMOUNT,
    expectChainCanonicalEndpoints,
    runChainReclaimAndExpectSingleCanonical,
    seedChainReclaim
} from '../harness/chain-reclaim-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, unconsolidationService } from '../harness/test-context';

const DIVERGENT_EXCHANGE_RATE = 0.5;

describe('consolidation/existing-transfer-chain-reclaim-rebuild', () => {
    // eslint-disable-next-line max-statements -- Integration scenario: seed + consolidate + multi-assert
    it('rebuilds a fresh FX-correct canonical when the existing transfer ledger diverges', async () => {
        const { sourceAccount, bridgeAccount, targetAccount, transfer, backingExpense, backingIncome, bridgeIncome, bridgeExpense } =
            seedChainReclaim({
                transferExchangeRate: DIVERGENT_EXCHANGE_RATE,
                transferFromEntryExchangeRate: DIVERGENT_EXCHANGE_RATE,
                transferToEntryExchangeRate: 2,
                transferFromEntryToIban: 'UA-WRONG'
            });

        const canonical = await runChainReclaimAndExpectSingleCanonical();
        expect(canonical.id).not.toBe(transfer.id);
        expectChainCanonicalEndpoints(canonical, sourceAccount, targetAccount);

        const rebuiltId = canonical.id;
        expect(testQueryService.fetchTransactionById(transfer.id).consolidationParentTransactionId).toBe(rebuiltId);
        expect(testQueryService.fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBe(rebuiltId);
        expect(testQueryService.fetchTransactionById(bridgeExpense.id).consolidationParentTransactionId).toBe(rebuiltId);

        const rebuiltEntries = testQueryService.fetchEntriesByTransactionId(rebuiltId);
        const liveEntries = rebuiltEntries.filter(entry => entry.originalTransactionId === null);
        expect(liveEntries).toHaveLength(2);
        const liveFromEntry = liveEntries.find(entry => entry.accountId === sourceAccount.id);
        const liveToEntry = liveEntries.find(entry => entry.accountId === targetAccount.id);
        expect(liveFromEntry?.amount).toBe(CHAIN_RECLAIM_SOURCE_AMOUNT);
        expect(liveFromEntry?.exchangeRate).toBe(CHAIN_RECLAIM_EXCHANGE_RATE);
        expect(liveFromEntry?.toIban).toBe('UA-TARGET');
        expect(liveToEntry?.amount).toBe(CHAIN_RECLAIM_TARGET_AMOUNT);
        expect(liveToEntry?.exchangeRate).toBe(1);

        expect(testQueryService.fetchLiveBalanceByAccount(sourceAccount.id)).toBe(-CHAIN_RECLAIM_SOURCE_AMOUNT);
        expect(testQueryService.fetchLiveBalanceByAccount(targetAccount.id)).toBe(CHAIN_RECLAIM_TARGET_AMOUNT);
        expect(testQueryService.fetchLiveBalanceByAccount(bridgeAccount.id)).toBe(0);

        const idempotentResult = await runConsolidation();
        expect(idempotentResult.consolidated).toBe(0);
        expect(idempotentResult.groups.existingTransferChainReclaimCandidates).toHaveLength(0);

        await unconsolidationService.unconsolidateById(rebuiltId, testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(0);

        const restoredTransfer = testQueryService.fetchTransactionById(transfer.id);
        expect(restoredTransfer.consolidationParentTransactionId).toBeNull();
        expect(restoredTransfer.consolidationType).toBe(TransactionConsolidationTypeEnum.TRANSFER_PAIR);
        expect(testQueryService.fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(bridgeExpense.id).consolidationParentTransactionId).toBeNull();

        expect(backingExpense).not.toBeNull();
        expect(backingIncome).not.toBeNull();
        expect(testQueryService.fetchTransactionById(backingExpense?.id ?? 0).consolidationParentTransactionId).toBe(transfer.id);
        expect(testQueryService.fetchTransactionById(backingIncome?.id ?? 0).consolidationParentTransactionId).toBe(transfer.id);
    });
});
