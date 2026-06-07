import { TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it } from 'vitest';

import {
    CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE,
    CHAIN_RECLAIM_OPERATED_AT,
    CHAIN_RECLAIM_TARGET_AMOUNT,
    seedChainReclaim
} from '../harness/chain-reclaim-fixture';
import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

const SECOND_BRIDGE_INCOME_OFFSET_MS = 20_000;
const SECOND_BRIDGE_EXPENSE_OFFSET_MS = 21_000;

describe('consolidation/existing-transfer-chain-reclaim-rank-dedup', () => {
    // eslint-disable-next-line max-statements -- Integration scenario: seed + consolidate + multi-assert
    it('reclaims exactly one bridge pair when two pairs surround a single transfer', async () => {
        const scenario = seedChainReclaim();
        const { transfer, bridgeIncome: firstBridgeIncome, bridgeExpense: firstBridgeExpense } = scenario;
        const secondBridgeAccount = testSeedService.bankSyncAccount('Bridge Two UAH', null, 'UA-BRIDGE-2', 1);
        const secondBridgeIncome = testSeedService.bankPairIncome(
            { externalId: 'bridge-two-income', operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + SECOND_BRIDGE_INCOME_OFFSET_MS) },
            {
                accountId: secondBridgeAccount.id,
                amount: CHAIN_RECLAIM_TARGET_AMOUNT,
                exchangeRate: CHAIN_RECLAIM_BRIDGE_EXCHANGE_RATE,
                toIban: 'UA-SOURCE'
            }
        );
        const secondBridgeExpense = testSeedService.bankPairExpense(
            {
                externalId: 'bridge-two-expense',
                operatedAt: new Date(CHAIN_RECLAIM_OPERATED_AT.getTime() + SECOND_BRIDGE_EXPENSE_OFFSET_MS)
            },
            { accountId: secondBridgeAccount.id, amount: CHAIN_RECLAIM_TARGET_AMOUNT, exchangeRate: 1, toIban: 'UA-TARGET' }
        );

        const result = await runConsolidation();
        expect(result.groups.existingTransferChainReclaimCandidates).toHaveLength(1);

        const canonicals = testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.IBAN_BRIDGE_CHAIN_TRANSFER);
        expect(canonicals).toHaveLength(1);
        expect(canonicals[0].id).toBe(transfer.id);

        const reclaimedSourceIds = testQueryService
            .fetchEntriesByTransactionId(transfer.id)
            .flatMap(entry => (entry.originalTransactionId ? [entry.originalTransactionId] : []));
        const firstPairReclaimed = reclaimedSourceIds.includes(firstBridgeIncome.id) && reclaimedSourceIds.includes(firstBridgeExpense.id);
        const secondPairReclaimed =
            reclaimedSourceIds.includes(secondBridgeIncome.id) && reclaimedSourceIds.includes(secondBridgeExpense.id);
        expect(firstPairReclaimed !== secondPairReclaimed).toBe(true);

        const orphanIncome = firstPairReclaimed ? secondBridgeIncome : firstBridgeIncome;
        const orphanExpense = firstPairReclaimed ? secondBridgeExpense : firstBridgeExpense;
        expect(testQueryService.fetchTransactionById(orphanIncome.id).consolidationParentTransactionId).toBeNull();
        expect(testQueryService.fetchTransactionById(orphanExpense.id).consolidationParentTransactionId).toBeNull();
    });
});
