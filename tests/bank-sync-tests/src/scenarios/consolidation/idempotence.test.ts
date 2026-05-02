import { describe, expect, it } from 'vitest';

import { TransactionConsolidationTypeEnum } from '@budgie/contracts';

import { fetchCanonicalsOfType, seedTransferPairFixture } from '../../harness';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

describe('consolidation/idempotence', () => {
    it('running consolidate twice on the same dataset only creates one canonical TRANSFER', async () => {
        seedTransferPairFixture();

        const firstResult = await transferConsolidationService.consolidate();
        const secondResult = await transferConsolidationService.consolidate();

        expect(firstResult.consolidated).toBe(1);
        expect(secondResult.consolidated).toBe(0);
        expect(secondResult.found).toBe(0);

        expect(fetchCanonicalsOfType(TransactionConsolidationTypeEnum.TRANSFER_PAIR)).toHaveLength(1);
    });
});
