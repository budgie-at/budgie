import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import { expect } from 'vitest';

import { run } from '../scenario/test-runtime';

export const expectSingleConsolidation = async (): Promise<void> => {
    const result = await run(transferConsolidationService.consolidate(null));

    expect(result.consolidated).toBe(1);
    expect(result.found).toBe(1);
};
