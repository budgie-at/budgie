import { transferConsolidationService } from '@app/sync/service/transfer-consolidation.service';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

export const expectSingleConsolidation = Effect.fnUntraced(function* () {
    const result = yield* transferConsolidationService.consolidate(null);

    expect(result.consolidated).toBe(1);
    expect(result.found).toBe(1);
});
