import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const runConsolidation = (scope: ConsolidationScanScopeInterface | null = null) =>
    Effect.flatMap(ConsolidationCoordinatorService, consolidationCoordinatorService => consolidationCoordinatorService.consolidate(scope));

export const expectSecondConsolidationRunStable = Effect.fnUntraced(function* () {
    const secondResult = yield* runConsolidation();

    expect(secondResult.consolidated).toBe(0);
    expect(secondResult.found).toBe(0);
});
