import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    CHAIN_RECLAIM_EXCHANGE_RATE,
    expectChainCanonicalEndpoints,
    runChainReclaimAndExpectSingleCanonical,
    seedChainReclaim
} from '../harness/chain-reclaim-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testDb, testQueryService, unconsolidationService } from '../harness/test-context';

describe('consolidation/existing-transfer-chain-reclaim-fast-path', () => {
    // eslint-disable-next-line max-statements -- Integration scenario: seed + consolidate + multi-assert
    it('absorbs the orphaned bridge legs into the existing transfer keeping its identity', async () => {
        const { sourceAccount, bridgeAccount, targetAccount, transfer, backingExpense, backingIncome, bridgeIncome, bridgeExpense } =
            seedChainReclaim();

        const sourceBalanceBefore = testQueryService.fetchLiveBalanceByAccount(sourceAccount.id);
        const targetBalanceBefore = testQueryService.fetchLiveBalanceByAccount(targetAccount.id);
        const bridgeBalanceBefore = testQueryService.fetchLiveBalanceByAccount(bridgeAccount.id);

        const canonical = await runChainReclaimAndExpectSingleCanonical();
        expect(canonical.id).toBe(transfer.id);
        expectChainCanonicalEndpoints(canonical, sourceAccount, targetAccount);

        expect(testQueryService.fetchTransactionById(bridgeIncome.id).consolidationParentTransactionId).toBe(transfer.id);
        expect(testQueryService.fetchTransactionById(bridgeExpense.id).consolidationParentTransactionId).toBe(transfer.id);

        expect(backingExpense).not.toBeNull();
        expect(backingIncome).not.toBeNull();

        const canonicalEntries = testQueryService.fetchEntriesByTransactionId(transfer.id);
        const sourceIds = canonicalEntries.flatMap(entry => (entry.originalTransactionId ? [entry.originalTransactionId] : []));
        expect(sourceIds.sort()).toEqual([backingExpense?.id, backingIncome?.id, bridgeIncome.id, bridgeExpense.id].sort());

        const liveCanonicalEntries = canonicalEntries.filter(entry => entry.originalTransactionId === null);
        expect(liveCanonicalEntries).toHaveLength(2);
        const liveFromEntry = liveCanonicalEntries.find(entry => entry.accountId === sourceAccount.id);
        const liveToEntry = liveCanonicalEntries.find(entry => entry.accountId === targetAccount.id);
        expect(liveFromEntry?.exchangeRate).toBe(CHAIN_RECLAIM_EXCHANGE_RATE);
        expect(liveToEntry?.exchangeRate).toBe(1);

        expect(testQueryService.fetchLiveBalanceByAccount(sourceAccount.id)).toBe(sourceBalanceBefore);
        expect(testQueryService.fetchLiveBalanceByAccount(targetAccount.id)).toBe(targetBalanceBefore);
        expect(testQueryService.fetchLiveBalanceByAccount(bridgeAccount.id)).toBe(bridgeBalanceBefore);

        const idempotentResult = await runConsolidation();
        expect(idempotentResult.consolidated).toBe(0);
        expect(idempotentResult.groups.existingTransferChainReclaimCandidates).toHaveLength(0);

        await unconsolidationService.unconsolidateById(transfer.id, testDb);

        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER)).toHaveLength(0);

        for (const restoredId of [backingExpense?.id, backingIncome?.id, bridgeIncome.id, bridgeExpense.id]) {
            expect(restoredId).toBeDefined();
            expect(testQueryService.fetchTransactionById(restoredId ?? 0).consolidationParentTransactionId).toBeNull();
        }

        expect(testQueryService.fetchEntryByExternalId('bridge-income').originalTransactionId).toBeNull();
        expect(testQueryService.fetchEntryByExternalId('bridge-expense').originalTransactionId).toBeNull();
        expect(testQueryService.fetchEntryByExternalId('transfer-backing-expense').originalTransactionId).toBeNull();
        expect(testQueryService.fetchEntryByExternalId('transfer-backing-income').originalTransactionId).toBeNull();
    });
});
