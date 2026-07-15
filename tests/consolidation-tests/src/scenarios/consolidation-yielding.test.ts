import { ConsolidationAutoCandidateService, ConsolidationFamilyRegistryService } from '@budgie/consolidation';
import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
    atmCashWithdrawalRepository,
    consolidationExecutorService,
    consolidationRepairExecutorService,
    existingTransferRepository,
    ibanBridgeTransferRepository,
    refundPairRepository,
    testQueryService,
    testSeedService,
    transferPairRepository
} from '../harness/test-context';

describe('consolidation/yielding', () => {
    it('yields while processing automatic candidate families', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        const yieldControl = vi.fn(async () => undefined);
        const consolidationFamilyRegistryService = new ConsolidationFamilyRegistryService(
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
        const consolidationAutoCandidateService = new ConsolidationAutoCandidateService(consolidationFamilyRegistryService);

        const result = await consolidationAutoCandidateService.process();

        expect(result.consolidated).toBe(1);
        expect(yieldControl.mock.calls.length).toBeGreaterThan(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
