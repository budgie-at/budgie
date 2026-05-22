import { expect } from 'vitest';

import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';

export const expectSingleConsolidation = async (): Promise<void> => {
    const result = await transferConsolidationService.consolidate();

    expect(result.consolidated).toBe(1);
    expect(result.found).toBe(1);
};
