import { describe, expect, it, vi } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';
import { ConsolidationAutoCandidateService } from '@budgie/consolidation';

import { consolidationCandidateService, consolidationExecutorService, testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/yielding', () => {
    it('yields while processing automatic candidate families', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        const groups = await consolidationCandidateService.findGroups();
        const yieldControl = vi.fn(async () => undefined);
        const consolidationAutoCandidateService = new ConsolidationAutoCandidateService(consolidationExecutorService, yieldControl);

        const consolidated = await consolidationAutoCandidateService.processGroups(groups);

        expect(consolidated).toBe(1);
        expect(yieldControl.mock.calls.length).toBeGreaterThan(1);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
