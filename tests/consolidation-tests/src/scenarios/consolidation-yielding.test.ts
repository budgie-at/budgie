import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
    atmCashWithdrawalRepository,
    consolidationExecutorService,
    consolidationRepairExecutorService,
    existingTransferRepository,
    ibanBridgeTransferRepository,
    refundPairRepository,
    runEffect,
    testQueryService,
    testSeedService,
    transferPairRepository
} from '../harness/test-context';

describe('consolidation/yielding', () => {
    it('yields while processing automatic candidate families', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        const yieldControl = vi.fn(async () => undefined);
        const consolidationCoordinatorService = new ConsolidationCoordinatorService(
            {
                atmCashWithdrawalRepository,
                existingTransferRepository,
                ibanBridgeTransferRepository,
                refundPairRepository,
                transferPairRepository
            },
            consolidationExecutorService,
            consolidationRepairExecutorService,
            yieldControl
        );

        const result = await runEffect(consolidationCoordinatorService.consolidate());

        expect(result.consolidated).toBe(1);
        expect(yieldControl.mock.calls.length).toBeGreaterThan(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
