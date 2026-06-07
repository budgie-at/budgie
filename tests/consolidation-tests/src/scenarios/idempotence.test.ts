import { describe, expect, it } from 'vitest';

import { PRECISION, TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { runConsolidation } from '../harness/run-consolidation';
import { testQueryService, testSeedService } from '../harness/test-context';

describe('consolidation/idempotence', () => {
    it('creates one canonical transfer when consolidation is run twice', async () => {
        const transferMcc = testQueryService.findMccByCode('4829');
        testSeedService.amountTransferPair(250 * PRECISION, transferMcc.id);

        const firstResult = await runConsolidation();
        const secondResult = await runConsolidation();

        expect(firstResult.consolidated).toBe(1);
        expect(secondResult.consolidated).toBe(0);
        expect(secondResult.found).toBe(0);
        expect(testQueryService.fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
