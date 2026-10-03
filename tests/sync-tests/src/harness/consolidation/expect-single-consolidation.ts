import { TransferConsolidationService } from '@budgie/sync';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

export const expectSingleConsolidation = Effect.fnUntraced(function* () {
    const transferConsolidationService = yield* TransferConsolidationService;
    const result = yield* transferConsolidationService.consolidate(null);

    expect(result.consolidated).toBe(1);
    expect(result.found).toBe(1);
});
