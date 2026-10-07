import { ConsolidationCoordinatorService } from '@budgie/consolidation';
import * as Effect from 'effect/Effect';
import { expect } from 'vitest';

import { rebuildStoredBalances } from './test-context';

import type { ConsolidationScanScopeInterface } from '@budgie/contracts';

export const runConsolidation = (scope: ConsolidationScanScopeInterface | null = null) =>
    rebuildStoredBalances.pipe(
        Effect.andThen(ConsolidationCoordinatorService),
        Effect.flatMap(consolidationCoordinatorService => consolidationCoordinatorService.consolidate(scope)),
        Effect.tap(() => rebuildStoredBalances)
    );

export const expectSecondConsolidationRunStable = Effect.fnUntraced(function* () {
    const secondResult = yield* runConsolidation();

    expect(secondResult.consolidated).toBe(0);
    expect(secondResult.found).toBe(0);
});
